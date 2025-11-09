import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt, IsPhoneNumber, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class BookingRequestRdo {
  @ApiProperty({ title: 'ID', example: 'gjsdkfljgfgq345gdf98sg' })
  @IsInt()
  id: number;

  @ApiProperty({ title: 'Full name', example: 'Danil Bashirov' })
  @IsString()
  @Expose()
  fullName: string;

  @ApiProperty({ title: 'Event name', example: 'LinkApp Technologies event' })
  @IsString()
  @Expose()
  eventName: string;

  @ApiProperty({ title: 'Event date', example: '2008-09-18T09:00:00.000' })
  @IsDate()
  @Expose()
  eventDate: Date;

  @ApiProperty({ title: 'Phone number', example: '+79952235123' })
  @IsPhoneNumber()
  @Expose()
  phone: string;

  @ApiProperty({ title: 'Created at date', example: '2024-02-10T17:00:00.000' })
  @IsDate()
  @Expose()
  createdAt: Date;

  @ApiProperty({ title: 'Updated at date', example: '2024-02-10T17:00:00.000' })
  @IsDate()
  @Expose()
  updatedAt: Date;
}
