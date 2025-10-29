import { PageRdo } from '../../../common/rdo/page.rdo';
import { ApiProperty } from '@nestjs/swagger';
import { OrderRdo } from './order.rdo';
import { IsArray, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class OrdersRdo extends PageRdo {
  @ApiProperty({ title: 'Orders list', type: [OrderRdo] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderRdo)
  @Expose()
  orders: OrderRdo[];
}