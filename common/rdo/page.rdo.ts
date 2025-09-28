import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class PageRdo {
  @ApiProperty({ title: 'Total', example: '123' })
  @IsNumber()
  @Expose()
  total: number;
}
