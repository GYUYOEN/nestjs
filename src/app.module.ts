import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { User } from './auth/entity/user.entity';
import { AuthModule } from './auth/auth.module';
import { UserEntity } from './users/entity/users.entity';
import { UserAuthority } from './auth/entity/user-authority.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3307,
      username: 'root',
      password: '1234',
      database: 'nest',
      entities: [UserEntity, User, UserAuthority],
      synchronize: false,
      logging: true
    }),
    UsersModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
