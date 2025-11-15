import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { SuccessRdo } from '../../common/rdo/success.rdo';
import { BookingRequestRdo } from './rdo/request.rdo';
import { UpdateRequestDto } from './dto/update-request.dto';
import { BookingRequestService } from './booking-request.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { BookingRequestsRdo } from './rdo/requests.rdo';
import { PageDto } from '../../common/dto/page.dto';
import { AuthJwtGuard } from '../auth/auth.guard';
import { AdminGuard } from '../user/admin.guard';

@Controller('booking-request')
export class BookingRequestController {
  constructor(private readonly requestService: BookingRequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking request' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'New request successfully created.',
    type: BookingRequestRdo,
  })
  async createRequest(
    @Body() dto: CreateRequestDto,
  ): Promise<BookingRequestRdo> {
    return this.requestService.createRequest(dto);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Retrieve a booking request by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request successfully retrieved.',
    type: BookingRequestRdo,
  })
  @ApiNotFoundResponse({
    example: new NotFoundException('Booking request not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard, AdminGuard)
  async fetchRequest(@Param('id') id: number): Promise<BookingRequestRdo> {
    return this.requestService.getRequestById(+id);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of booking requests' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of requests successfully retrieved.',
    type: BookingRequestsRdo,
  })
  @UseGuards(AuthJwtGuard, AdminGuard)
  async getRequests(@Query() dto: PageDto): Promise<BookingRequestsRdo> {
    return this.requestService.getRequests(dto.page, dto.limit);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update an existing booking request' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request successfully updated.',
    type: BookingRequestRdo,
  })
  @ApiNotFoundResponse({
    example: new NotFoundException('Booking request not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard, AdminGuard)
  async updateRequest(
    @Param('id') id: number,
    @Body() dto: UpdateRequestDto,
  ): Promise<BookingRequestRdo> {
    return this.requestService.updateRequest(+id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a booking request by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request successfully deleted.',
    type: SuccessRdo,
  })
  @ApiNotFoundResponse({
    example: new NotFoundException('Booking request not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard, AdminGuard)
  async deleteRequest(@Param('id') id: number): Promise<SuccessRdo> {
    return this.requestService.deleteRequest(+id);
  }
}
