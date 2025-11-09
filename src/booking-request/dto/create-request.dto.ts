import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsPhoneNumber, IsString } from 'class-validator';

export class CreateRequestDto {
  @ApiProperty({ title: 'Full name', example: 'Danil Bashirov' })
  @IsString()
  fullName: string;

  @ApiProperty({ title: 'Event name', example: 'LinkApp Technologies event' })
  @IsString()
  eventName: string;

  @ApiProperty({ title: 'Event date', example: '2008-09-18T09:00:00.000' })
  @IsDateString()
  eventDate: string;

  @ApiProperty({ title: 'Phone number', example: '+79952235123' })
  @IsPhoneNumber()
  phone: string;
}