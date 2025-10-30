import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';
import { OrderMediaRdo } from './order-media.rdo';

export class OrderRdo {
  @ApiProperty({ title: 'Order ID', example: 'gsjdfjasjk12340fasg' })
  @IsString()
  @Expose()
  id: string;

  @ApiProperty({ title: 'Payment ID', example: 'gjsdgjsldkfgj2094vdfasf' })
  @IsString()
  @Expose()
  paymentId: string;

  @ApiProperty({
    title: 'Order status',
    example: OrderStatus.APPROVED,
    enum: OrderStatus,
  })
  @IsEnum(OrderStatus)
  @Expose()
  status: OrderStatus;

  @ApiProperty({ title: 'Media list', type: [OrderMediaRdo] })
  @IsArray()
  @Type(() => OrderMediaRdo)
  @Expose()
  orderMedia: OrderMediaRdo[];
}
