import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    title: 'Name',
    example: 'Saint-Petersburg International Economics Forum',
  })
  @IsString()
  name: string;

  @ApiProperty({ title: 'Price', example: '1000' })
  @IsString()
  price: string;

  @ApiProperty({
    title: 'Date',
    example: '2024-07-02T00:00:00',
    description: 'Date iso string',
  })
  @IsDateString()
  date: string;
}
