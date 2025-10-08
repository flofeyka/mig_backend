import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSpeechDto {
  @ApiProperty({ title: 'Name', example: 'The last speech', required: false })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ title: 'Flow ID', example: 'dfjaskfl3424lfa34' })
  @IsString()
  flowId: string;
}
