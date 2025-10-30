import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class BuyMediasDto {
  @ApiProperty({
    title: 'Medias id',
    example: { id: '1fglksjfgqro90-fsgdsfg', requiresProcessing: true },
  })
  @IsArray()
  medias: {
    id: string;
    requiresProcessing: boolean;
  }[];
}
