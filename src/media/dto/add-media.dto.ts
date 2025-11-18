import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddMediaDto {
  @ApiProperty({ title: 'Member id', example: 'fgskfdjgq2430gsfg34g' })
  @IsString()
  memberId: string;

  @ApiPropertyOptional({ title: 'Price', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(501)
  price: number;
}
