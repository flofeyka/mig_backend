import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserRdo {
  @ApiProperty({
    title: 'User ID',
    example: 1,
  })
  @IsNumber()
  @Expose()
  id: number;

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
