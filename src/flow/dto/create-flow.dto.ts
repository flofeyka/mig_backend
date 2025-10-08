import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsDateString, IsString } from 'class-validator';

export class CreateFlowDto {
  @ApiProperty({ title: 'Name', example: 'The first flow' })
  @IsString()
  name: string;

  @ApiProperty({ title: 'From date', example: '2024-02-03T00:00:00' })
  @IsDateString()
  from: string;

  @ApiProperty({ title: 'From date', example: '2024-02-03T00:00:00' })
  @IsDateString()
  to: string;

  @ApiProperty({ title: 'Event id', example: 'fgskdfjgkls2134gass' })
  @IsString()
  eventId: string;
}
