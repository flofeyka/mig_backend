import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PageDto {
  @ApiProperty({ title: 'Page number', example: '1' })
  @IsOptional()
  @IsString()
  page: string;

  @ApiProperty({ title: 'Page limit', example: '15' })
  @IsOptional()
  @IsString()
  limit: string;
}
