import { Body, Controller, Get, Param, Post, Put, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';

import { JwtAccessAuthGuard } from './security/jwt.auth.guard';
import { AuthService } from './auth.service';
import { UserDTO } from './dto/user.dto';
import { RolesGuard } from './security/roles.guard';
import { Roles } from './decorator/role.decorator';
import { RoleType } from './role-type';
import { UserService } from './user.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService,
    ) {}

    // 회원가입
    @Post('/register')
    async registerAccount(@Req() req: Request, @Body() UserDTO: UserDTO): Promise<any> {
        return await this.authService.registerUser(UserDTO);
    }

    // 로그인
    @Post('/login')
    async login(@Body() userDTO: UserDTO, @Res({ passthrough: true }) res: Response): Promise<any> {
        const user = await this.authService.validateUser(userDTO);
        
        const access_token = await this.authService.generateAccessToken(user);
        const refresh_token = await this.authService.generateRefreshToken(user);
            
        await this.userService.setCurrentRefreshToken(refresh_token,user.id);

        res.setHeader('Authorization', 'Bearer ' + [access_token, refresh_token]);
        res.cookie('access_token', access_token, {
            httpOnly: true,
        });
        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
        });
        return {
            message: 'login success',
            access_token: access_token,
            refresh_token: refresh_token,
        };
    }

    // 토큰확인
    @Get('/authenticate')
    @UseGuards(JwtAccessAuthGuard)
    async isAuthenticated(@Req() req: Request): Promise<any> {
        const user: any = req.user;
        return user;
    }

    // 관리자 회원 목록 조회
    @Get('/selectUsers')
    @UseGuards(JwtAccessAuthGuard, RolesGuard)
    @Roles(RoleType.ADMIN)
    selectUsers(): Promise<any> {
        return this.authService.selectUsers();
    }

    // 비밀번호 변경
    @Post('/passwordUpdate')
    @UseGuards(JwtAccessAuthGuard)
    passwordUpdate(@Req() req: Request, @Body() userDTO: UserDTO): Promise<any> {
        const user: any = req.user;
        return this.authService.passwordUpdate(user, userDTO);
    }

    // 이메일 인증
    @Post('/verifyEmail')
    async sendVerification(@Body() body) {
        return await this.authService.sendVerification(body.email);
    }

    // 로그인 시 부여받은 refresh-token을 통해 새로운 access-token 부여
    @Post('refresh')
    async refresh(
        @Body() refreshTokenDto: RefreshTokenDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        try {
            const newAccessToken = (await this.authService.refresh(refreshTokenDto)).accessToken;
            res.setHeader('Authorization', 'Bearer ' + newAccessToken);
            res.cookie('access_token', newAccessToken, {
                httpOnly: true,
            });
            res.send({newAccessToken});
        } catch(err) {
            throw new UnauthorizedException('Invalid refresh-token');
        }
    }

    // 로그아웃 시 토큰 삭제
    @Post('logout')
    @UseGuards(JwtAccessAuthGuard)
    async logout(@Req() req: any, @Res() res: Response): Promise<any> {
      await this.userService.removeRefreshToken(req.user.id);
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return res.send({
        message: 'logout success'
      });
    }
}
