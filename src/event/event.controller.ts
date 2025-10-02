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
  UploadedFiles,
  UseGuards,
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
import { EventAccessGuard } from './guards/event-access.guard';
import { EventAccess } from 'common/decorators/EventAccess';
import { AuthJwtGuard } from 'src/auth/auth.guard';
import { User } from 'common/decorators/User';
import { UserRdo } from 'src/user/rdo/user.rdo';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @ApiOperation({ summary: 'Create an event' })
  @ApiOkResponse({ type: EventRdo })
  @UseInterceptors(FilesInterceptor('media'))
  @UseGuards(AuthJwtGuard)
  @Post('/')
  createEvent(
    @Body() dto: CreateEventDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<EventRdo> {
    return this.eventService.createEvent(dto, files);
  }

  @ApiOperation({ summary: 'Get event by id' })
  @ApiOkResponse({ type: EventRdo })
  @UseGuards(EventAccessGuard)
  @Get('/:id')
  getEvent(
    @Param('id') id: string,
    @Query() dto: PageDto,
    @EventAccess() hasAccess: boolean,
  ): Promise<EventRdo> {
    return this.eventService.fetchEvent(id, dto, hasAccess);
  }

  @ApiOperation({ summary: 'Update an event by id' })
  @ApiOkResponse({ type: EventRdo })
  @UseInterceptors(FilesInterceptor('media'))
  @UseGuards(AuthJwtGuard)
  @Put('/:id')
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
  @UseGuards(AuthJwtGuard)
  @Delete('/:id')
  deleteEvent(@Param('id') id: string): Promise<SuccessRdo> {
    return this.eventService.deleteEvent(id);
  }

  @ApiOperation({ summary: 'Fetch events by page' })
  @ApiOkResponse({ type: EventsRdo })
  @UseGuards(EventAccessGuard)
  @Get('/')
  fetchEvents(
    @Query() dto: PageDto,
    @EventAccess() hasAccess: boolean,
  ): Promise<EventsRdo> {
    return this.eventService.fetchEvents(dto, hasAccess);
  }

  @ApiOperation({ summary: 'Buy an event by id' })
  @ApiOkResponse({ type: SuccessRdo })
  @UseGuards(AuthJwtGuard)
  @Post('/buy/:id')
  buyEvent(
    @Param('id') id: string,
    @User() user: UserRdo,
  ): Promise<SuccessRdo> {
    return this.eventService.buyEvent(id, user.id);
  }
}
