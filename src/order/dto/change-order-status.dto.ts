import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ChangeOrderStatusDto {
  @ApiProperty({
    title: 'Status',
    example: OrderStatus.APPROVED,
    enum: OrderStatus,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}