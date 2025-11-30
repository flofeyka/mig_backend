import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';

class MemberDto {
  @IsString()
  id: string;
}

class MediaDto {
  @IsString()
  id: string;
  @IsBoolean()
  requiresProcessing: boolean;
}

export class CreatePaymentOrderDto {
  @ApiProperty({ title: 'Members', example: [{ id: '123123' }] })
  @ValidateNested({ each: true })
  @Type(() => MemberDto)
  members: MemberDto[];

  @ApiProperty({
    title: 'Medias',
    example: [{ id: '1fglksjfgqro90-fsgdsfg', requiresProcessing: true }],
  })
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  medias: MediaDto[];
}
