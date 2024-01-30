import { Body, Controller, Get, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthGuard } from './security/auth.guard';
import { AuthService } from './auth.service';
import { UserDTO } from './dto/user.dto';
import { RolesGuard } from './security/roles.guard';
import { Roles } from './decorator/role.decorator';
import { RoleType } from './role-type';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
    ) {}

    // 회원가입
    @Post('/register')
    async registerAccount(@Req() req: Request, @Body() UserDTO: UserDTO): Promise<any> {
        return await this.authService.registerUser(UserDTO);
    }

    // 로그인
    @Post('/login')
    async login(@Body() userDTO: UserDTO, @Res() res: Response): Promise<any> {
        const jwt = await this.authService.validateUser(userDTO);
        res.setHeader('Authorization', 'Baerer ' + jwt.accessToken);
        return res.json(jwt);
    }

    // 토큰확인
    @Get('/authenticate')
    @UseGuards(AuthGuard)
    isAuthenticated(@Req() req: Request): any {
        const user: any = req.user;
        return user;
    }

    // 관리자 회원 목록 조회
    @Get('/selectUsers')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(RoleType.ADMIN)
    selectUsers(): Promise<any> {
        return this.authService.selectUsers();
    }

    // 비밀번호 변경
    @Post('/passwordUpdate')
    @UseGuards(AuthGuard)
    passwordUpdate(@Req() req: Request, @Body() userDTO: UserDTO): Promise<any> {
        const user: any = req.user;
        return this.authService.passwordUpdate(user, userDTO);
    }

    // 이메일 인증
    @Post('/verifyEmail')
    async sendVerification(@Body() body) {
        return await this.authService.sendVerification(body.email);
    }
}
