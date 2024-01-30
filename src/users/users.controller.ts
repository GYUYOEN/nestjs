import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserEntity } from './entity/users.entity';

@Controller('users')
export class UsersController {
    constructor(
        private usersService: UsersService
    ) {}

    // 회원 전체 목록 조회
    @Get()
    findAll(): Promise<UserEntity[]> {
        return this.usersService.findAll();
    }

    // 하나의 회원 조회
    @Get(':id')
    findOne(@Param('id')id: number): Promise<UserEntity> {
        return this.usersService.findOne(id);
    }

    // 회원 생성
    @Post()
    create(@Body()user: UserEntity) {
        return this.usersService.create(user);
    }

    // 회원 비밀번호 수정
    @Put(':id')
    passwordUpdate(@Param('id')id: number, @Body() user: UserEntity) {
        this.usersService.passwordUpdate(id, user);
        return `This action updates a #${id} user`;
    }

    // 회원 삭제
    @Delete(':id')
    remove(@Param('id')id: number) {
        this.usersService.remove(id);
    }
}
