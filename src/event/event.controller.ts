import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { EventRdo } from './rdo/event.rdo';
import { PageRdo } from 'common/rdo/page.rdo';
import { PageDto } from 'common/dto/page.dto';
import { EventsRdo } from './rdo/events.rdo';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateEventDto } from './dto/update-event.dto';
import { SuccessRdo } from 'common/rdo/success.rdo';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @ApiOperation({ summary: 'Create an event' })
  @ApiOkResponse({ type: EventRdo })
  @UseInterceptors(FilesInterceptor('media'))
  @Post('/')
  createEvent(
    @Body() dto: CreateEventDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<EventRdo> {
    return this.eventService.createEvent(dto, files);
  }

  @ApiOperation({ summary: 'Update an event by id' })
  @ApiOkResponse({ type: EventRdo })
  @UseInterceptors(FilesInterceptor('media'))
  @Post('/')
  updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<EventRdo> {
    return this.eventService.updateEvent(id, dto, files);
  }

  @ApiOperation({ summary: 'Delete an event' })
  @ApiOkResponse({ type: SuccessRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Event not found').getResponse(),
  })
  @Delete('/:id')
  async deleteEvent(@Param('id') id: string): Promise<SuccessRdo> {
    return this.eventService.deleteEvent(id);
  }

  @ApiOperation({ summary: 'Fetch events by page' })
  @ApiOkResponse({ type: EventsRdo })
  @Get('/')
  fetchEvents(@Query() dto: PageDto) {
    return this.eventService.fetchEvents(dto);
  }
}
