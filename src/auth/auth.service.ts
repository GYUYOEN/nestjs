import { BadRequestException, ConsoleLogger, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { UserService } from './user.service';
import { UserDTO } from './dto/user.dto';
import { User } from './entity/user.entity';
import { Payload } from './security/payload.interface';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email/email.service';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenDto } from './dto/refresh-token.dto';

let count = 5;

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService,
    ) {}

    // 회원가입
    async  registerUser(newUser: UserDTO): Promise<UserDTO> {
        let userFind: UserDTO = await this.userService.findByFields({
            where: { email: newUser.email }
        });

        // 유저를 찾았을 경우
        if(userFind) {
            throw new HttpException(`Email aleady used!`, HttpStatus.BAD_REQUEST);
        }

        return await this.userService.save(newUser);
    }

    // 로그인
    async validateUser(userDTO: UserDTO): Promise<User> {
        let userFind: User = await this.userService.findByFields({
            where: { email: userDTO.email }
        });

        console.log(count)

        // 로그인 5회 시도 시 잠금
        if (count === 0) {
            throw new UnauthorizedException('Login locked!')
        }
        
        // 유저가 없는경우
        if(!userFind) {
            count--;
            throw new UnauthorizedException('User not found!');
        }

        // 비밀번호가 클린경우
        const validatePassword = await bcrypt.compare(userDTO.password, userFind.password);
        if (!validatePassword) {
            count--;
            throw new BadRequestException('Invalid password!');
        }

        return userFind;
    }

    // access-token 발급
    async generateAccessToken(user: User): Promise<string> {
        const payload: Payload = {
          id: user.id,
          email: user.email,
          authorities: user.authorities,
        }
        return this.jwtService.signAsync(payload);
      }
    
    // refresh-token 발급
    async generateRefreshToken(user: User): Promise<string> {
        const payload: Payload = {
            id: user.id,
            email: user.email,
            authorities: user.authorities,
        }
        return this.jwtService.signAsync({id: payload.id}, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME'),
        });
    }

    // refresh-token 이용하여 토큰 재발급
    async refresh(refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string }> {
        const { refresh_token } = refreshTokenDto;

        const decodedRefreshToken = this.jwtService.verify(refresh_token, { secret: process.env.JWT_REFRESH_SECRET }) as Payload;

        const userId = decodedRefreshToken.id;
        const user = await this.userService.getUserIfRefreshTokenMatches(refresh_token, userId);
        if (!user) {
            throw new UnauthorizedException('Invalid user!');
        }

        const accessToken = await this.generateAccessToken(user);

        return {accessToken};
    }

    // 관리자 회원 목록 조회
    async selectUsers(): Promise<User[]> {
        return await this.userService.findAll();
    }

    // 이메일 전송토큰
    async sendVerification(email: string) {
        const verifyToken = this.generateRandomNumber();
        
        console.log('캐싱할 데이터: ', email, verifyToken);

        await this.sendVerifyToken(email, verifyToken);
    }
     
    async sendVerifyToken(email: string, verifyToken: number) {
        await this.emailService.sendVerifyToken(email, verifyToken);
    }

    private generateRandomNumber(): number {
        var minm = 100000;
        var maxm = 999999;
        return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
    }
    
    // 비밀번호 변경
    async passwordUpdate(user: any, userDTO: UserDTO): Promise<string> {
        const checkUpdate: boolean = await this.userService.update(user, userDTO);
        if(checkUpdate) {
            return "비밀번호 변경 성공"
        }
        return "비밀번호 변경 실패"
    }

    // jwt 토큰 일치 여부
    async tokenValidateUser(payload: Payload): Promise<User | undefined> {
        const userFind = await this.userService.findByFields({
            where: { id: payload.id }
        });
        this.flatAuthorities(userFind);
        return userFind;
    }

    // 권한 관련 설정
    private flatAuthorities(user: any): User {
        if(user && user.authorities) {
            const authorities: string[] = [];
            user.authorities.forEach(authority => authorities.push(authority.authorityName));
            user.authorities = authorities;
        }
        return user;
    }
}
