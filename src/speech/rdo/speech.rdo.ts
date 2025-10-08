import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { MemberRdo } from 'src/member/rdo/member.rdo';

export class SpeechRdo {
  @ApiProperty({ title: 'ID', example: 'klkjfdlskjadsf1234' })
  @IsString()
  @Expose()
  id: string;

  @ApiProperty({ title: 'Name', example: 'The last speech', required: false })
  @IsOptional()
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({ title: 'Flow ID', example: 'dfjaskfl3424lfa34' })
  @IsString()
  @Expose()
  flowId: string;

  @ApiProperty({ title: 'Members', type: [MemberRdo] })
  @Expose()
  members: MemberRdo;
}
