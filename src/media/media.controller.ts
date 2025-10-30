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
import { BuyMediasDto } from './dto/buy-medias.dto';
import { SuccessPaymentLinkRdo } from './rdo/success-payment-link.rdo';
import { AdminGuard } from '../user/admin.guard';
import { OrderMediaRdo } from '../order/rdo/order-media.rdo';

@ApiTags('Media')
@Controller('/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiOperation({ summary: 'Delete media by id' })
  @ApiOkResponse({ type: SuccessRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Media not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard, AdminGuard)
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
  @UseGuards(AuthJwtGuard, AdminGuard)
  @Post('/')
  addMedia(
    @Body() dto: AddMediaDto,
    @UploadedFile() files: Express.Multer.File,
  ) {
    return this.mediaService.addMedia(dto.memberId, files);
  }

  @ApiOperation({ summary: 'Buy a media' })
  @ApiOkResponse({ type: SuccessRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Media not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard)
  @Post('/buy')
  buyMedia(
    @Body() dto: BuyMediasDto,
    @User() user: UserRdo,
  ): Promise<SuccessPaymentLinkRdo> {
    return this.mediaService.buyMedia(dto.medias, user.id);
  }

  @ApiOperation({ summary: 'Upload processed photo' })
  @ApiOkResponse({ type: OrderMediaRdo })
  @UseInterceptors(FileInterceptor('media'))
  @UseGuards(AuthJwtGuard, AdminGuard)
  @Post('/order-media/:mediaId/:orderId')
  uploadProcessedPhoto(
    @Param('mediaId') mediaId: string,
    @Param('orderId') orderId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.uploadProcessedMedia(orderId, mediaId, file);
  }

  @ApiOperation({ summary: 'Change media order by id' })
  @ApiOkResponse({ type: MediaRdo })
  @UseGuards(AuthJwtGuard, AdminGuard)
  @Put('/order/:id')
  changeOrder(
    @Param('id') id: string,
    @Body() dto: UpdateMediaOrderDto,
  ): Promise<MediaRdo> {
    return this.mediaService.changeOrder(id, dto.order);
  }
}
