import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({ title: 'Speech ID', example: 'dfjaskdfh423mvamf' })
  @IsString()
  speechId: string;
}
