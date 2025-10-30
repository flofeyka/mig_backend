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
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { EventRdo } from './rdo/event.rdo';
import { PageDto } from 'common/dto/page.dto';
import { EventsRdo } from './rdo/events.rdo';
import { UpdateEventDto } from './dto/update-event.dto';
import { SuccessRdo } from 'common/rdo/success.rdo';
import { AuthJwtGuard } from 'src/auth/auth.guard';
import { AdminGuard } from '../user/admin.guard';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @ApiOperation({ summary: 'Create an event' })
  @ApiOkResponse({ type: EventRdo })
  @UseGuards(AuthJwtGuard, AdminGuard)
  @Post('/')
  createEvent(@Body() dto: CreateEventDto): Promise<EventRdo> {
    return this.eventService.createEvent(dto);
  }

  @ApiOperation({ summary: 'Get event by id' })
  @ApiOkResponse({ type: EventRdo })
  @Get('/:id')
  getEvent(@Param('id') id: string): Promise<EventRdo> {
    return this.eventService.fetchEvent(id);
  }

  @ApiOperation({ summary: 'Update an event by id' })
  @ApiOkResponse({ type: EventRdo })
  @UseGuards(AuthJwtGuard, AdminGuard)
  @Put('/:id')
  updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ): Promise<EventRdo> {
    return this.eventService.updateEvent(id, dto);
  }

  @ApiOperation({ summary: 'Delete an event' })
  @ApiOkResponse({ type: SuccessRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Event not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard, AdminGuard)
  @Delete('/:id')
  deleteEvent(@Param('id') id: string): Promise<SuccessRdo> {
    return this.eventService.deleteEvent(id);
  }

  @ApiOperation({ summary: 'Fetch events by page' })
  @ApiOkResponse({ type: EventsRdo })
  @Get('/')
  fetchEvents(@Query() dto: PageDto): Promise<EventsRdo> {
    return this.eventService.fetchEvents(dto);
  }
}
