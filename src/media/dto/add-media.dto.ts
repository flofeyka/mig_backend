import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddMediaDto {
  @ApiProperty({ title: 'Member id', example: 'fgskfdjgq2430gsfg34g' })
  @IsString()
  memberId: string;
}
