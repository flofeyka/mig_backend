import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { StorageModule } from 'src/storage/storage.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { MediaModule } from '../media/media.module';
import { EventAccessGuard } from './guards/event-access.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, MediaModule, AuthModule],
  controllers: [EventController],
  providers: [EventService, MediaModule, EventAccessGuard],
})
export class EventModule {}
