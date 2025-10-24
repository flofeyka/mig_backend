import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEventDto {
  @ApiProperty({
    title: 'Name',
    example: 'Saint-Petersburg International Economics Forum',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    title: 'Date',
    example: '2024-07-02T00:00:00',
    description: 'Date iso string',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
