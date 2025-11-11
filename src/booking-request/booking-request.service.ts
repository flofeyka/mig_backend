import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { BookingRequestRdo } from './rdo/request.rdo';
import { PrismaService } from '../../prisma/prisma.service';
import { fillDto } from '../../common/utils/fillDto';
import { BookingRequestsRdo } from './rdo/requests.rdo';
import { SuccessRdo } from '../../common/rdo/success.rdo';
import { UpdateRequestDto } from './dto/update-request.dto';

@Injectable()
export class BookingRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(dto: CreateRequestDto): Promise<BookingRequestRdo> {
    const request = await this.prisma.bookingRequest.create({
      data: { ...dto, date: new Date(dto.date) },
    });

    return fillDto(BookingRequestRdo, request);
  }

  async getRequestById(id: number): Promise<BookingRequestRdo> {
    const request = await this.prisma.bookingRequest.findUnique({
      where: { id },
    });

    if (!request) throw new NotFoundException('Booking request not found');

    return fillDto(BookingRequestRdo, request);
  }

  async getRequests(
    page: number = 1,
    limit: number = 15,
  ): Promise<BookingRequestsRdo> {
    const where = {};

    const [requests, total] = await Promise.all([
      this.prisma.bookingRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bookingRequest.count({ where }),
    ]);

    return fillDto(BookingRequestsRdo, { requests, total });
  }

  async deleteRequest(id: number): Promise<SuccessRdo> {
    try {
      await this.prisma.bookingRequest.delete({ where: { id } });

      return fillDto(SuccessRdo, { success: true });
    } catch (e) {
      console.error(`[${id}]: Cannot delete the booking request`, e);
      throw new NotFoundException('Booking request not found');
    }
  }

  async updateRequest(id: number, dto: UpdateRequestDto) {
    try {
      const request = await this.prisma.bookingRequest.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.date && { date: new Date(dto.date) }),
        },
      });

      return fillDto(BookingRequestRdo, request);
    } catch (e) {
      console.error(`[${id}]: Cannot update the booking request`, e);
      throw new NotFoundException('Booking request not found');
    }
  }
}
