import {
  Body,
  Controller,
  Delete,
  NotFoundException,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MediaService } from './media.service';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SuccessRdo } from 'common/rdo/success.rdo';
import { MediaRdo } from './rdo/media.rdo';
import { UpdateMediaOrderDto } from './dto/update-media-order.dto';
import { AddMediaDto } from './dto/add-media.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthJwtGuard } from 'src/auth/auth.guard';
import { User } from 'common/decorators/User';
import { UserRdo } from 'src/user/rdo/user.rdo';

@ApiTags('Media')
@Controller('/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiOperation({ summary: 'Delete media by id' })
  @ApiOkResponse({ type: SuccessRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Media not found').getResponse(),
  })
  @Delete('/:id')
  deleteMedia(@Param('id') id: string): Promise<SuccessRdo> {
    return this.mediaService.deleteMedia(id);
  }

  @ApiOperation({ summary: 'Add media to member' })
  @ApiOkResponse({ type: MediaRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Member not found').getResponse(),
  })
  @UseInterceptors(FileInterceptor('media'))
  @Post('/')
  addMedia(
    @Body() dto: AddMediaDto,
    @UploadedFile() files: Express.Multer.File,
  ) {
    return this.mediaService.addMedia(dto.memberId, dto.price, files);
  }

  @ApiOperation({ summary: 'Buy a media' })
  @ApiOkResponse({ type: SuccessRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Media not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard)
  @Post('/buy/:id')
  buyMedia(
    @Param('id') id: string,
    @User() user: UserRdo,
  ): Promise<SuccessRdo> {
    return this.mediaService.buyMedia(id, user.id);
  }

  @ApiOperation({ summary: 'Change media order by id' })
  @ApiOkResponse({ type: MediaRdo })
  @Put('/order/:id')
  changeOrder(
    @Param('id') id: string,
    @Body() dto: UpdateMediaOrderDto,
  ): Promise<MediaRdo> {
    return this.mediaService.changeOrder(id, dto.order);
  }
}
