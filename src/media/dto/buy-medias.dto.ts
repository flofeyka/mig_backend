import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class BuyMediasDto {
  @ApiProperty({
    title: 'Medias id',
    example: ['gsfdgjk3h2gfs34234', 'fajsdfjaskdjfq234q2f'],
  })
  @IsString({ each: true })
  medias: string[];
}
