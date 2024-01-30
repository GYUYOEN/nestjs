import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
    ) {}

    // 회원 전체 목록 조회
    findAll(): Promise<UserEntity[]> {
        return this.usersRepository.find();
    }

    // 하나의 회원 조회
    findOne(id: number): Promise<UserEntity> {
        return this.usersRepository.findOne({ where: { id } });
    }

    // 회원 생성
    async create(user: UserEntity): Promise<void> {
        await this.usersRepository.save(user);
    }

    // 회원 삭제
    async remove(id: number): Promise<void> {
        await this.usersRepository.delete(id);
    }

    // 회원 비밀번호 수정
    async passwordUpdate(id: number, user: UserEntity): Promise<void> {
        const existedUser = await this.usersRepository.findOne({ where: { id } });
        
        // 회원 존재할 경우
        if(existedUser) {
            await this.usersRepository
            .createQueryBuilder()
            .update(UserEntity)
            .set({
                password: user.password,
            })
            .where("id = :id", {id})
            .execute();
        }
    }
}
