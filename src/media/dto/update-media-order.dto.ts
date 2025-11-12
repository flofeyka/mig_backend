import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateMediaOrderDto {
  @ApiProperty({ title: 'Order', example: 2 })
  @IsNumber()
  order: number;
}
