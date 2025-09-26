import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { UserRdo } from './rdo/user.rdo';
import { AuthJwtGuard } from 'src/auth/auth.guard';
import { User } from 'common/decorators/User';

@Controller('user')
export class UserController {
  @ApiOperation({ summary: 'Get user data' })
  @ApiOkResponse({ type: UserRdo })
  @UseGuards(AuthJwtGuard)
  @Get('/')
  getUserData(@User() user: UserRdo) {
    return user;
  }
}
