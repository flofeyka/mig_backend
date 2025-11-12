import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class AddMediaDto {
  @ApiProperty({ title: 'Member id', example: 'fgskfdjgq2430gsfg34g' })
  @IsString()
  memberId: string;

  @ApiPropertyOptional({ title: 'Price', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  price: number;
}
