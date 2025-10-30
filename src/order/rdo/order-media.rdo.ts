import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';
import { MediaRdo } from '../../media/rdo/media.rdo';
import { Expose, Type } from 'class-transformer';

export class OrderMediaRdo {
  @ApiProperty({ title: 'ID', example: 'hsgdfgjk20499gsdfg2' })
  @IsString()
  id: string;

  @ApiProperty({ title: 'Media data', type: MediaRdo })
  @Type(() => MediaRdo)
  @Expose()
  media: MediaRdo;

  @ApiProperty({
    title: 'Processed full version',
    example: 'https://cloud.yandex.ru/preview/123.png',
  })
  @IsString()
  @Expose()
  processedFullVersion: string;

  @ApiProperty({
    title: 'Processed preview version',
    example: 'https://cloud.yandex.ru/preview/123.png',
  })
  @IsString()
  @Expose()
  processedPreview: string;

  @ApiProperty({ title: 'Display order', example: 1 })
  @IsInt()
  @Expose()
  displayOrder: number;
}
