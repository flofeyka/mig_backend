import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { MediaRdo } from 'src/media/rdo/media.rdo';

export class MemberRdo {
  @ApiProperty({ title: 'ID', example: '34jk12fjkjasdfd34' })
  @IsString()
  @Expose()
  id: string;

  @ApiProperty({ title: 'Media', type: [MediaRdo] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaRdo)
  @Expose()
  media: MediaRdo;

  @ApiProperty({ title: 'Speech id', example: '123' })
  @IsString()
  @Expose()
  speechId: string;
}
