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

@Module({
  imports: [
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
