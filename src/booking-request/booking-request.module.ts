import { Module } from '@nestjs/common';
import { BookingRequestService } from './booking-request.service';
import { BookingRequestController } from './booking-request.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [BookingRequestService],
  controllers: [BookingRequestController],
})
export class BookingRequestModule {}
