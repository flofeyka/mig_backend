import { ApiProperty } from '@nestjs/swagger';
import { PageRdo } from 'common/rdo/page.rdo';
import { MemberRdo } from './member.rdo';
import { Expose } from 'class-transformer';

export class MembersRdo extends PageRdo {
  @ApiProperty({ title: 'Members list', example: [MemberRdo] })
  @Expose()
  members: MemberRdo;
}
