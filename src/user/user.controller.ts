import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { UserRdo } from './rdo/user.rdo';
import { AuthJwtGuard } from 'src/auth/auth.guard';
import { User } from 'common/decorators/User';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get user data' })
  @ApiOkResponse({ type: UserRdo })
  @UseGuards(AuthJwtGuard)
  @Get('/')
  getUserData(@User() user: UserRdo) {
    return user;
  }

  @ApiOperation({ summary: 'Update user data' })
  @ApiOkResponse({ type: UserRdo })
  @UseGuards(AuthJwtGuard)
  @Put('/')
  updateUserData(@User() user: UserRdo, @Body() dto: UpdateUserDto) {
    return this.userService.editUserData(user.id, dto);
  }
}
