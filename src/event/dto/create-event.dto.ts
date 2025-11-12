import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    title: 'Name',
    example: 'Saint-Petersburg International Economics Forum',
  })
  @IsString()
  name: string;

  @ApiProperty({
    title: 'Date',
    example: '2024-07-02T00:00:00',
    description: 'Date iso string',
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({ title: 'Order deadline', example: '2024-07-02T00:00:00' })
  @Type(() => Date)
  @IsDate()
  orderDeadline: Date;

  @ApiProperty({ title: 'Location', example: 'Tyumen, Russia' })
  @IsString()
  location: string;
}
