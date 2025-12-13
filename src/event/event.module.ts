import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { MediaModule } from '../media/media.module';
import { AuthModule } from 'src/auth/auth.module';
import { BullModule } from '@nestjs/bullmq';
import { EventZipProcessor } from './event-zip.processor';

@Module({
  imports: [PrismaModule, MediaModule, AuthModule, BullModule.registerQueue({name: 'zip-processing'})],
  controllers: [EventController],
  providers: [EventService, MediaModule, EventZipProcessor],
})
export class EventModule {}
