import {
  Body,
  Controller,
  Delete,
  NotFoundException,
  Param,
  Put,
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

@ApiTags('Event media')
@Controller('/event/media')
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
