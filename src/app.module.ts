import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { ConfigModule } from '@nestjs/config';
import { EventModule } from './event/event.module';
import { SpeechModule } from './speech/speech.module';
import { FlowModule } from './flow/flow.module';
import { MemberModule } from './member/member.module';
import { PaymentModule } from './payment/payment.module';
import * as AdminJSNestjs from '@adminjs/nestjs';

const DEFAULT_ADMIN = {
  email: 'admin@example.com',
  password: 'password',
};

const authenticate = async (email: string, password: string) => {
  if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
    return Promise.resolve(DEFAULT_ADMIN);
  }
  return null;
};

@Module({
  imports: [
    AdminJSNestjs.AdminModule.createAdmin({
      adminJsOptions: {
        rootPath: '/admin',
        resources: [],
      },
      auth: {
        authenticate,
        cookieName: 'adminjs',
        cookiePassword: 'secret',
      },
    }),
    PaymentModule,
    UserModule,
    AuthModule,
    StorageModule,
    ConfigModule.forRoot({ isGlobal: true }),
    EventModule,
    SpeechModule,
    FlowModule,
    MemberModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
