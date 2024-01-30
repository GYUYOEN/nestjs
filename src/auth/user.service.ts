import { Injectable } from "@nestjs/common";
import { FindOneOptions, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import * as bcrypt from 'bcrypt';

import { User } from "./entity/user.entity";
import { UserDTO } from "./dto/user.dto";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    // 이미 사용자가 등록이 됐는지 안됐는지 확인하기 위한 조회
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
} 