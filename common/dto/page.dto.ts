import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max } from 'class-validator';

export class PageDto {
  @ApiProperty({ title: 'Page number', example: '1' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiProperty({ title: 'Page limit', example: '15' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  limit?: number;
}
