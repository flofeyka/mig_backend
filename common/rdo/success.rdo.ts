import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class SuccessRdo {
  @ApiProperty({ title: 'Success operation value', example: true })
  @IsBoolean()
  @Expose()
  success: boolean;
}
