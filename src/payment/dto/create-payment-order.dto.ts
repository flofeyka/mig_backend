import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';

class SpeechDto {
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
  @ApiProperty({ title: 'Speeches', example: [{ id: '123123' }] })
  @ValidateNested({ each: true })
  @Type(() => SpeechDto)
  speeches: SpeechDto[];

  @ApiProperty({
    title: 'Medias',
    example: { id: '1fglksjfgqro90-fsgdsfg', requiresProcessing: true },
  })
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  medias: MediaDto[];
}
