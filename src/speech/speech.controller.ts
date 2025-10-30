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
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SpeechService } from './speech.service';
import { CreateSpeechDto } from './dto/create-speech.dto';
import { UpdateSpeechDto } from './dto/update-speech.dto';
import { SpeechRdo } from './rdo/speech.rdo';
import { SpeechesRdo } from './rdo/speeches.rdo';
import { SuccessRdo } from 'common/rdo/success.rdo';
import { AuthJwtGuard } from 'src/auth/auth.guard';
import { PageDto } from 'common/dto/page.dto';
import { AdminGuard } from '../user/admin.guard';

@ApiTags('Speech')
@ApiBearerAuth()
@Controller('/speech')
export class SpeechController {
  constructor(private readonly speechService: SpeechService) {}

  @ApiOperation({ summary: 'Create new speech' })
  @ApiOkResponse({ type: SpeechRdo })
  @UseGuards(AuthJwtGuard, AdminGuard)
  @Post()
  createSpeech(@Body() dto: CreateSpeechDto): Promise<SpeechRdo> {
    return this.speechService.createSpeech(dto);
  }

  @ApiOperation({ summary: 'Get all speeches with pagination' })
  @ApiOkResponse({ type: SpeechesRdo })
  @Get('/all/:id')
  fetchAllSpeeches(
    @Param('id') id: string,
    @Query() dto: PageDto,
  ): Promise<SpeechesRdo> {
    return this.speechService.getAllSpeeches(id, dto?.page, dto?.limit);
  }

  @ApiOperation({ summary: 'Get speech by id' })
  @ApiOkResponse({ type: SpeechRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Speech not found').getResponse(),
  })
  @Get('/:id')
  fetchSpeech(@Param('id') id: string): Promise<SpeechRdo> {
    return this.speechService.getSpeechById(id);
  }

  @ApiOperation({ summary: 'Update speech by id' })
  @ApiOkResponse({ type: SpeechRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Speech not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard, AdminGuard)
  @Put('/:id')
  updateSpeech(
    @Param('id') id: string,
    @Body() dto: UpdateSpeechDto,
  ): Promise<SpeechRdo> {
    return this.speechService.updateSpeech(id, dto);
  }

  @ApiOperation({ summary: 'Delete speech by id' })
  @ApiOkResponse({ type: SuccessRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Speech not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard, AdminGuard)
  @Delete('/:id')
  async deleteSpeech(@Param('id') id: string): Promise<SuccessRdo> {
    await this.speechService.deleteSpeech(id);
    return { success: true };
  }
}
