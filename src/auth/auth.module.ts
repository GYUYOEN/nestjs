import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtStrategy } from './security/passport.jwt.strategy';
import { User } from './entity/user.entity';
import { UserService } from './user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserAuthority } from './entity/user-authority.entity';
import { EmailService } from './email/email.service';
import { PassportModule } from '@nestjs/passport';
import { JwtRefreshStrategy } from './security/jwt.refresh.strategy';
import { JwtAccessAuthGuard } from './security/jwt.auth.guard';
import { JwtRefreshGuard } from './security/jwt.refresh,guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserAuthority]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRATION_TIME'),
        } 
      }),
    }),
    PassportModule.register({}),
  ],
  exports: [TypeOrmModule],
  controllers: [AuthController],
  providers: [AuthService, UserService, EmailService, JwtRefreshStrategy, JwtAccessAuthGuard, JwtRefreshGuard, JwtStrategy],
})
export class AuthModule {}
