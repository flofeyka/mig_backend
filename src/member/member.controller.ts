import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberRdo } from './rdo/member.rdo';
import { MembersRdo } from './rdo/members.rdo';
import { SuccessRdo } from 'common/rdo/success.rdo';
import { PageDto } from 'common/dto/page.dto';
import { User } from 'common/decorators/User';
import { UserRdo } from 'src/user/rdo/user.rdo';
import { AuthJwtGuard } from 'src/auth/auth.guard';
import { OptionalAuth } from 'common/decorators/OptionalAuth';
import { AdminGuard } from '../user/admin.guard';

@ApiTags('Member')
@Controller('/member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @ApiOperation({ summary: 'Create new member' })
  @ApiOkResponse({ type: MemberRdo })
  @UseGuards(AuthJwtGuard, AdminGuard)
  @Post()
  createMember(@Body() dto: CreateMemberDto): Promise<MemberRdo> {
    return this.memberService.createMember(dto);
  }

  @ApiOperation({ summary: 'Get all members with pagination' })
  @ApiOkResponse({ type: MembersRdo })
  @Get()
  fetchAllMembers(@Query() dto: PageDto): Promise<MembersRdo> {
    return this.memberService.getAllMembers(dto?.page, dto?.limit);
  }

  @ApiOperation({ summary: 'Get member by id' })
  @ApiOkResponse({ type: MemberRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Member not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard)
  @OptionalAuth()
  @Get('/:id')
  fetchMember(
    @Param('id') id: string,
    @Query() dto: PageDto,
    @User() user?: UserRdo,
  ): Promise<MemberRdo> {
    return this.memberService.getMemberById(id, user?.id, dto.page, dto.limit);
  }

  @ApiOperation({ summary: 'Update member by id' })
  @ApiOkResponse({ type: MemberRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Member not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard, AdminGuard)
  @Put('/:id')
  updateMember(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ): Promise<MemberRdo> {
    return this.memberService.updateMember(id, dto);
  }

  @ApiOperation({ summary: 'Delete member by id' })
  @ApiOkResponse({ type: SuccessRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Member not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard, AdminGuard)
  @Delete('/:id')
  async deleteMember(@Param('id') id: string): Promise<SuccessRdo> {
    await this.memberService.deleteMember(id);
    return { success: true };
  }
}
