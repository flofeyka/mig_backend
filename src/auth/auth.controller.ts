import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { AuthRdo } from './rdo/auth-rdo';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Sign up' })
  @ApiOkResponse({ type: AuthRdo })
  @ApiBadRequestResponse({
    example: new BadRequestException(
      'User with this login already exists',
    ).getResponse(),
  })
  @Post('/sign-up')
  async signUp(@Body() dto: SignUpDto): Promise<AuthRdo> {
    return await this.authService.signUp(dto);
  }

  @ApiOperation({ summary: 'Sign in' })
  @ApiOkResponse({ type: AuthRdo })
  @ApiUnauthorizedResponse({
    example: new UnauthorizedException('Wrong login or password').getResponse(),
  })
  @Post('/sign-in')
  async signIn(@Body() dto: AuthDto): Promise<AuthRdo> {
    return await this.authService.signIn(dto);
  }

  @ApiOperation({ summary: 'Refresh token' })
  @ApiOkResponse({ type: AuthRdo })
  @ApiUnauthorizedResponse({
    example: new UnauthorizedException('Token invalid').getResponse(),
  })
  @Post('/refresh')
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthRdo> {
    return await this.authService.refreshToken(dto.refreshToken);
  }
}
