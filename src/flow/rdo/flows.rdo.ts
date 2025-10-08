import { ApiProperty } from '@nestjs/swagger';
import { PageRdo } from 'common/rdo/page.rdo';
import { FlowRdo } from './flow.rdo';
import { IsArray, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class FlowsRdo extends PageRdo {
  @ApiProperty({ title: 'Flows', example: [FlowRdo] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowRdo)
  @Expose()
  flows: FlowRdo;
}
