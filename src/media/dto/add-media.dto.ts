import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class AddMediaDto {
  @ApiProperty({ title: 'Member id', example: 'fgskfdjgq2430gsfg34g' })
  @IsString()
  memberId: string;

  @ApiProperty({ title: 'Price', example: 12351.34 })
  @Type(() => Number)
  @IsNumber()
  price: number;
}
