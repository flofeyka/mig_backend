import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { MediaModule } from '../media/media.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, MediaModule, AuthModule],
  controllers: [EventController],
  providers: [EventService, MediaModule],
})
export class EventModule {}
