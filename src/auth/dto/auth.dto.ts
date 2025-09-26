import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuthDto {
  @ApiProperty({
    title: 'Login',
    example: 'Supalonely',
  })
  @IsString()
  login: string;

  @ApiProperty({
    title: 'Password',
    example: 'Qwerty1234567',
  })
  @IsString()
  password: string;
}
