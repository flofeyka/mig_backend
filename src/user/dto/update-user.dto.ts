import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    title: 'login',
    example: 'Qwerty',
  })
  @IsOptional()
  @IsString()
  login: string;

  @ApiProperty({
    title: 'email',
    example: 'email@email.ru',
  })
  @IsOptional()
  @IsEmail()
  email: string;
}
