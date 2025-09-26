import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './auth.controller';
import { AuthJwtGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { TokenService } from './token/token.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, AuthJwtGuard],
  exports: [AuthJwtGuard, TokenService],
})
export class AuthModule {}
