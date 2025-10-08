import { ApiProperty } from '@nestjs/swagger';
import { Media } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { MediaRdo } from '../../media/rdo/media.rdo';

export class EventRdo {
  @ApiProperty({ title: 'ID', example: 'cmgas45bsfdgq33g' })
  @IsString()
  @Expose()
  id: string;

  @ApiProperty({
    title: 'Name',
    example: 'Saint-Petersburg International Economics Forum',
  })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({ title: 'Price', example: 1000 })
  @IsNumber()
  @Expose()
  price: number;

  @ApiProperty({
    title: 'Date',
    example: '2024-07-02T00:00:00',
    description: 'Date iso string',
  })
  @IsDateString()
  @Expose()
  date: Date;

  @ApiProperty({ title: 'Last photo', required: false })
  @Expose()
  lastPhoto: MediaRdo;

  @ApiProperty({ title: 'Total media', example: 5 })
  @IsNumber()
  @Expose()
  totalMedia: number;

  @ApiProperty({ title: 'Created at date', example: '' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ title: 'Created at date', example: '' })
  @Expose()
  updatedAt: Date;
}
