import { PageRdo } from '../../../common/rdo/page.rdo';
import { ApiProperty } from '@nestjs/swagger';
import { BookingRequestRdo } from './request.rdo';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BookingRequestsRdo extends PageRdo {
  @ApiProperty({ title: 'Requests', type: [BookingRequestRdo] })
  @ValidateNested({ each: true })
  @Type(() => BookingRequestRdo)
  requests: BookingRequestRdo[];
}
