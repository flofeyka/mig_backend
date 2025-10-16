import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UserRdo {
  @ApiProperty({
    title: 'User ID',
    example: 1,
  })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({
    title: 'User fullName',
    example: 'Danil Bashirov',
  })
  @IsString()
  @Expose()
  fullname: string;

  @ApiProperty({
    title: 'Login',
    example: 'Qwerty',
  })
  @IsString()
  @Expose()
  login: string;

  @ApiPropertyOptional({ title: 'Email', example: 'email@email.ru' })
  @IsOptional()
  @IsEmail()
  @Expose()
  email: string;
}
