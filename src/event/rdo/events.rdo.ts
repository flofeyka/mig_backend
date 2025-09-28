import { ApiProperty } from '@nestjs/swagger';
import { PageRdo } from 'common/rdo/page.rdo';
import { EventRdo } from './event.rdo';
import { IsArray } from 'class-validator';
import { Expose } from 'class-transformer';

export class EventsRdo extends PageRdo {
  @ApiProperty({ title: 'Events', type: [EventRdo] })
  @IsArray()
  @Expose()
  events: EventRdo;
}
