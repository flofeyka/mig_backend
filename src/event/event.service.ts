import { Injectable, NotFoundException } from '@nestjs/common';
import { PageDto } from 'common/dto/page.dto';
import { SuccessRdo } from 'common/rdo/success.rdo';
import { fillDto } from 'common/utils/fillDto';
import { PrismaService } from 'prisma/prisma.service';
import sharp from 'sharp';
import { StorageType } from 'src/storage/storage.interface';
import { StorageService } from 'src/storage/storage.service';
import { v4 as uuid } from 'uuid';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventRdo } from './rdo/event.rdo';
import { EventsRdo } from './rdo/events.rdo';
import * as fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';

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
        include: {
          media: true,
        },
      });
    }

    return event as EventRdo;
  }

  async updateEvent(
    id: string,
    dto: UpdateEventDto,
    files: Express.Multer.File[],
  ): Promise<EventRdo> {
    try {
      const price = dto.price ? +dto.price : undefined;
      const date = dto.date ? new Date(dto.date) : undefined;
      const lastMedia = await this.prisma.media.findFirst({
        where: { eventId: id },
        orderBy: {
          order: 'desc',
        },
        take: 1,
        select: { order: true },
      });
      const event = await this.prisma.event.update({
        where: { id },
        data: {
          ...dto,
          price,
          date,
          media: {
            createMany: {
              data: await this.uploadFiles(id, files, lastMedia?.order),
              skipDuplicates: true,
            },
          },
        },
        include: {
          media: true,
        },
      });

      return event as EventRdo;
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

  private async fixOrder() {}

  private async processPreviewImage(fileBuffer: Buffer): Promise<Buffer> {
    const image = sharp(fileBuffer);
    const metadata = await image.metadata();
    const imgWidth = metadata.width || 800;
    const imgHeight = metadata.height || 600;

    const watermarkPath = path.join(
      process.cwd(),
      'common',
      'assets',
      'watermark.png',
    );
    const watermarkBuffer = await sharp(fs.readFileSync(watermarkPath))
      .resize({ height: Math.floor(imgHeight / 16) })
      .toBuffer();
    const watermarkMetadata = await sharp(watermarkBuffer).metadata();
    const watermarkWidth = watermarkMetadata.width || 100;
    const watermarkHeight = watermarkMetadata.height || 100;

    const compositeLayers: sharp.OverlayOptions[] = [];

    for (let y = 0; y < imgHeight; y += watermarkHeight) {
      for (let x = 0; x < imgWidth; x += watermarkWidth) {
        compositeLayers.push({
          input: watermarkBuffer,
          top: y,
          left: x,
          blend: 'overlay',
        });
      }
    }

    const outputBuffer = await image.composite(compositeLayers).toBuffer();

    return outputBuffer;
  }

  private async uploadFiles(
    id: string,
    files: Express.Multer.File[],
    prevIndex: number = 0,
  ) {
    return await Promise.all(
      files.map(async (mediaFile, index: number) => {
        const currentIndex = prevIndex + index + 1;
        const filename = String(currentIndex) + '-' + uuid() + '.' + 'png';
        const [preview, fullVersion] = await Promise.all([
          this.storageService.uploadFile(
            await this.processPreviewImage(mediaFile.buffer),
            filename,
            {
              folder: `/preview/${id}`,
              storageType: StorageType.S3_PUBLIC,
            },
          ),
          this.storageService.uploadFile(mediaFile.buffer, filename, {
            folder: `/original/${id}`,
            storageType: StorageType.S3_PUBLIC,
          }),
        ]);
        return {
          filename,
          fullVersion,
          order: currentIndex,
          preview,
        };
      }),
    );
  }
}
