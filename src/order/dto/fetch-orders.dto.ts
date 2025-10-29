import { PageDto } from '../../../common/dto/page.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class FetchOrdersDto extends PageDto {
  @ApiPropertyOptional({
    title: 'Status',
    example: OrderStatus.APPROVED,
    enum: OrderStatus,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
