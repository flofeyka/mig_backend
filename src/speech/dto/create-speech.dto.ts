import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateSpeechDto {
  @ApiPropertyOptional({ title: 'Name', example: 'The last speech' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ title: 'Is speech group', example: true })
  @IsBoolean()
  isGroup: boolean;

  @ApiPropertyOptional({ title: 'Price', example: 5000 })
  @IsOptional()
  @IsInt()
  price: number;

  @ApiProperty({ title: 'Flow ID', example: 'dfjaskfl3424lfa34' })
  @IsString()
  flowId: string;
}
