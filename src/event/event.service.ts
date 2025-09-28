import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { fillDto } from 'common/utils/fillDto';
import { EventRdo } from './rdo/event.rdo';
import { PageDto } from 'common/dto/page.dto';
import { PageRdo } from 'common/rdo/page.rdo';
import { EventsRdo } from './rdo/events.rdo';
import { StorageService } from 'src/storage/storage.service';
import { v4 as uuid } from 'uuid';
import { UpdateEventDto } from './dto/update-event.dto';
import { SuccessRdo } from 'common/rdo/success.rdo';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async createEvent(
    dto: CreateEventDto,
    files: Express.Multer.File[],
  ): Promise<EventRdo> {
    let event = await this.prisma.event.create({
      data: {
        ...dto,
        price: +dto.price,
        date: new Date(dto.date),
        media: undefined,
      },
    });

    if (files.length) {
      event = await this.prisma.event.update({
        where: { id: event.id },
        data: {
          media: {
            createMany: {
              data: await this.uploadFiles(event.id, files),
            },
          },
        },
      });
    }

    return fillDto(EventRdo, event);
  }

  async updateEvent(
    id: string,
    dto: UpdateEventDto,
    files: Express.Multer.File[],
  ): Promise<EventRdo> {
    try {
      const price = dto.price ? +dto.price : undefined;
      const event = await this.prisma.event.update({
        where: { id },
        data: {
          ...dto,
          price,
          media: {
            createMany: {
              data: await this.uploadFiles(id, files),
            },
          },
        },
      });

      return fillDto(EventRdo, event);
    } catch (e) {
      console.error(e);
      throw new NotFoundException('Event not found');
    }
  }

  async deleteEvent(id: string): Promise<SuccessRdo> {
    try {
      await this.prisma.event.delete({ where: { id } });

      return fillDto(SuccessRdo, { success: true });
    } catch (e) {
      console.error(e);
      throw new NotFoundException('Event not found');
    }
  }

  async fetchEvents(dto: PageDto): Promise<EventsRdo> {
    const { page = '1', limit = '15' } = dto;
    const where = {};

    const [total, events] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        skip: (+page - 1) * +limit,
        take: +limit,
        include: {
          media: {
            take: 5,
          },
        },
      }),
    ]);

    return fillDto(EventsRdo, { events, total });
  }

  fillDto() {}

  private async uploadFiles(id: string, files: Express.Multer.File[]) {
    return await Promise.all(
      files.map(async (mediaFile, index: number) => {
        const filename = String(index + 1) + '-' + uuid();
        const [preview, fullVersion] = await Promise.all([
          this.storageService.uploadFile(mediaFile.buffer, filename, {
            folder: `/preview/${id}`,
          }),
          this.storageService.uploadFile(mediaFile.buffer, filename, {
            folder: `/original/${id}`,
          }),
        ]);
        return {
          filename,
          fullVersion,
          preview,
        };
      }),
    );
  }
}
