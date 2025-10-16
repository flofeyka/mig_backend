import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    title: 'login',
    example: 'Qwerty',
  })
  @IsString()
  login: string;

  @ApiProperty({
    title: 'login',
    example: 'Qwerty',
  })
  @IsString()
  email: string;

  @ApiProperty({
    title: 'login',
    example: 'Qwerty',
  })
  @IsString()
  fullname: string;

  @ApiProperty({
    title: 'password',
    example: 'qwerty12345678',
  })
  @IsString()
  password: string;
}
