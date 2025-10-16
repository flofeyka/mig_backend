import { ApiProperty } from '@nestjs/swagger';
import { AuthDto } from './auth.dto';
import { IsEmail, IsString } from 'class-validator';

export class SignUpDto extends AuthDto {
  @ApiProperty({
    title: 'Email',
    example: 'supaflofeyka@mail.ru',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    title: 'login',
    example: 'Qwerty',
  })
  @IsString()
  fullname: string;
}
