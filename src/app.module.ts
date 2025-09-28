import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { ConfigModule } from '@nestjs/config';
import { EventModule } from './event/event.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    StorageModule,
    ConfigModule.forRoot({ isGlobal: true }),
    EventModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
