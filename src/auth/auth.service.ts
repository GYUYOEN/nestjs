import { ConsoleLogger, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { UserService } from './user.service';
import { UserDTO } from './dto/user.dto';
import { User } from './entity/user.entity';
import { Payload } from './security/payload.interface';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email/email.service';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private readonly emailService: EmailService,
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
    async validateUser(userDTO: UserDTO): Promise<{accessToken: string} | undefined> {
        let userFind: User = await this.userService.findByFields({
            where: { email: userDTO.email }
        });

        const validatePassword = await bcrypt.compare(userDTO.password, userFind.password);

        // 유저가 없거나 비밀번호가 틀릴 경우
        if(!userFind || !validatePassword) {
            throw new UnauthorizedException();
        }

        this.convertInAuthorities(userFind);
        // jwt
        const payload: Payload = { 
            id: userFind.id, 
            email: userFind.email, 
            authorities: userFind.authorities 
        };

        return {
            accessToken: this.jwtService.sign(payload)
        };
    }

    // 관리자 회원 목록 조회
    async selectUsers(): Promise<User[]> {
        return await this.userService.findAll();
    }

    async sendVerification(email: string) {
        const verifyToken = this.generateRandomNumber();
        
        console.log('캐싱할 데이터: ', email, verifyToken);
        // TODO: verifyToken이랑 이메일 캐싱

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

    async tokenValidateUser(payload: Payload): Promise<User | undefined> {
        const userFind = await this.userService.findByFields({
            where: { id: payload.id }
        });
        this.flatAuthorities(userFind);
        return userFind;
    }

    private flatAuthorities(user: any): User {
        if(user && user.authorities) {
            const authorities: string[] = [];
            user.authorities.forEach(authority => authorities.push(authority.authorityName));
            user.authorities = authorities;
        }
        return user;
    }

    private convertInAuthorities(user: any): User {
        if(user && user.authorities) {
            const authorities: any[] = [];
            user.authorities.forEach(authority => {
                authorities.push({name: authority.authorityName});
            });
            user.authorities = authorities;
        }
        return user;
    }
}
