import { Injectable, NotFoundException } from '@nestjs/common';
import { SuccessRdo } from 'common/rdo/success.rdo';
import { fillDto } from 'common/utils/fillDto';
import * as fs from 'fs';
import path from 'path';
import { PrismaService } from 'prisma/prisma.service';
import sharp from 'sharp';
import { StorageType } from 'src/storage/storage.interface';
import { StorageService } from 'src/storage/storage.service';
import { v4 as uuid } from 'uuid';
import { UpdateMediaOrderDto } from './dto/update-media-order.dto';
import { MediaRdo } from './rdo/media.rdo';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async changeOrder(id: string, newOrder: number): Promise<MediaRdo> {
    const media = await this.prisma.media.findUnique({ where: { id } });

    if (!media) throw new NotFoundException('Media not found');

    const oldOrder = media.order;

    if (newOrder === oldOrder) return fillDto(MediaRdo, media);

    const direction = newOrder > oldOrder ? 'down' : 'up';

    const eventId = media.eventId;

    const shiftRange =
      direction === 'down'
        ? { gte: oldOrder + 1, lte: newOrder }
        : { gte: newOrder, lte: oldOrder - 1 };

    const shiftDelta = direction === 'down' ? -1 : 1;

    const [_, updatedMedia] = await this.prisma.$transaction([
      this.prisma.media.updateMany({
        where: {
          eventId,
          order: shiftRange,
        },
        data: {
          order: {
            increment: shiftDelta,
          },
        },
      }),

      this.prisma.media.update({
        where: { id },
        data: { order: newOrder },
      }),
    ]);

    return fillDto(MediaRdo, updatedMedia);
  }

  async updateMedia(id: string, dto: UpdateMediaOrderDto): Promise<MediaRdo> {
    try {
      await this.changeOrder(id, dto.order);
      const updated = await this.prisma.media.update({
        where: { id },
        data: dto,
      });
      return fillDto(MediaRdo, updated);
    } catch (e) {
      console.error(e);
      throw new NotFoundException('Media not found');
    }
  }

  async deleteMedia(id: string): Promise<SuccessRdo> {
    try {
      const media = await this.prisma.media.findUnique({ where: { id } });

      if (!media) throw new NotFoundException('Media not found');

      const { eventId, order } = media;

      await this.prisma.$transaction([
        this.prisma.media.delete({ where: { id } }),

        this.prisma.media.updateMany({
          where: {
            eventId,
            order: { gt: order },
          },
          data: {
            order: {
              decrement: 1,
            },
          },
        }),
      ]);
      return fillDto(SuccessRdo, { success: true });
    } catch (e) {
      throw new NotFoundException('Media not found');
    }
  }

  async processPreviewImage(fileBuffer: Buffer): Promise<Buffer> {
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

  async uploadFiles(
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
