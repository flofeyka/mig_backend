import { ApiProperty } from '@nestjs/swagger';
import { Media } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @ApiProperty({ title: 'Media', required: false })
  @Expose()
  media: Media[];

  @ApiProperty({ title: 'Created at date', example: '' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ title: 'Created at date', example: '' })
  @Expose()
  updatedAt: Date;
}
