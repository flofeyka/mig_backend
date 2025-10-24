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
import { PaymentService } from 'src/payment/payment.service';
import { SuccessPaymentLinkRdo } from './rdo/success-payment-link.rdo';

@Injectable()
export class MediaService {
  private readonly mediaPrice: number = 400;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly paymentService: PaymentService,
  ) {}

  async changeOrder(id: string, newOrder: number): Promise<MediaRdo> {
    const media = await this.prisma.media.findUnique({ where: { id } });

    if (!media) throw new NotFoundException('Media not found');

    const oldOrder = media.order;

    if (newOrder === oldOrder) return fillDto(MediaRdo, media);

    const direction = newOrder > oldOrder ? 'down' : 'up';

    const memberId = media.memberId;

    const shiftRange =
      direction === 'down'
        ? { gte: oldOrder + 1, lte: newOrder }
        : { gte: newOrder, lte: oldOrder - 1 };

    const shiftDelta = direction === 'down' ? -1 : 1;

    const [_, updatedMedia] = await this.prisma.$transaction([
      this.prisma.media.updateMany({
        where: {
          memberId,
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

  async addMedia(
    memberId: string,
    file: Express.Multer.File,
  ): Promise<MediaRdo> {
    try {
      const lastMedia = await this.prisma.media.findFirst({
        where: { memberId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const fileData = await this.uploadFile(memberId, 1, file);
      const media = await this.prisma.media.create({
        data: {
          ...fileData,
          memberId,
          order: (lastMedia?.order || 0) + 1,
        },
      });

      return fillDto(MediaRdo, media);
    } catch (e) {
      console.error(e);
      throw new NotFoundException('Member not found');
    }
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

  async buyMedia(
    medias: string[],
    userId: number,
  ): Promise<SuccessPaymentLinkRdo> {
    try {
      const mediasFound = await this.prisma.media.findMany({
        where: {
          id: {
            in: medias,
          },
        },
        select: { id: true },
      });

      const url = await this.paymentService.generatePaymentUrl(
        mediasFound.length * 400,
        userId,
        mediasFound,
        `Покупка ${mediasFound.length} медиа`,
      );

      return fillDto(SuccessPaymentLinkRdo, { success: true, url });
    } catch (e) {
      console.error(e);
      throw new NotFoundException('Media not found');
    }
  }

  async deleteMedia(id: string): Promise<SuccessRdo> {
    try {
      const media = await this.prisma.media.findUnique({ where: { id } });

      if (!media) throw new NotFoundException('Media not found');

      const { memberId, order } = media;

      await this.prisma.$transaction([
        this.prisma.media.delete({ where: { id } }),

        this.prisma.media.updateMany({
          where: {
            memberId,
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

  async uploadFile(id: string, index: number, file: Express.Multer.File) {
    const filename = String(index) + '-' + uuid() + '.' + 'png';
    const [preview, fullVersion] = await Promise.all([
      this.storageService.uploadFile(
        await this.processPreviewImage(file.buffer),
        filename,
        {
          folder: `/preview/${id}`,
          storageType: StorageType.S3_PUBLIC,
        },
      ),
      this.storageService.uploadFile(file.buffer, filename, {
        folder: `/original/${id}`,
        storageType: StorageType.S3_PUBLIC,
      }),
    ]);
    return {
      filename,
      fullVersion,
      order: index,
      preview,
    };
  }
}
