import { Injectable } from "@nestjs/common";
import { FindOneOptions, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import * as bcrypt from 'bcrypt';

import { User } from "./entity/user.entity";
import { UserDTO } from "./dto/user.dto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private configService: ConfigService,
    ) {}

    // 회원 조회
    async findByFields(options: FindOneOptions<User>): Promise<User | undefined> {
        return await this.userRepository.findOne(options);
    }

    // 회원가입 저장
    async save(userDTO: UserDTO): Promise<UserDTO | undefined > {
        await this.transformPassword(userDTO);
        return await this.userRepository.save(userDTO);
    }

    // 회원 전체 조회
    async findAll(): Promise<User[]> {
        return await this.userRepository.find();
    }

    async update(user: any, userDTO: UserDTO): Promise<boolean> {
        const id = user.id;
        const existedUser = await this.userRepository.findOne({ where: { id } });
       
        // 회원 존재할 경우
        if(existedUser) {
            await this.transformPassword(userDTO);

            await this.userRepository
            .createQueryBuilder()
            .update(User)
            .set({
                password: userDTO.password,
            })
            .where("id = :id", { id })
            .execute();
            
            return true;
        }

        return false;
    }

    // 비밀번호 암호화
    async transformPassword(user: UserDTO): Promise<void> {
        user.password = await bcrypt.hash(
            user.password, 10,
        );
        return Promise.resolve();
    }

    // refresh-token db에 저장
    async setCurrentRefreshToken(refreshToken: string, userId: number) {
        const currentRefreshToken = await this.getCurrentHashedRefreshToken(refreshToken);
        const currentRefreshTokenExp = await this.getCurrentRefreshTokenExp();
        await this.userRepository.update(userId, {
            currentRefreshToken: currentRefreshToken,
            currentRefreshTokenExp: currentRefreshTokenExp,
        });
    }

    // refresh-token 발급
    async getCurrentHashedRefreshToken(refreshToken: string) {
        const saltOrRounds = 10;
        const currentRefreshToken = await bcrypt.hash(refreshToken, saltOrRounds);
        return currentRefreshToken;
    }

    // refresh-token 발급 날짜
    async getCurrentRefreshTokenExp(): Promise<Date> {
        const currentDate = new Date();
        const currentRefreshTokenExp = new Date(currentDate.getTime() + parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME')));
        return currentRefreshTokenExp;
    }

    // refresh-token 일치 여부
    async getUserIfRefreshTokenMatches(refreshToken: string, userId: number): Promise<User> {
        const id = userId;
        const user: User = await this.userRepository.findOne({
            where: { id }
        });
    
        if (!user.currentRefreshToken) {
          return null;
        }
        
        const isRefreshTokenMatching = await bcrypt.compare(
          refreshToken,
          user.currentRefreshToken
        );
    
        if (isRefreshTokenMatching) {
          return user;
        } 
      }

      // refresh-token db에서 삭제
      async removeRefreshToken(userId: number): Promise<any> {
        return await this.userRepository.update(userId, {
          currentRefreshToken: null,
          currentRefreshTokenExp: null,
        });
      }
    

} 