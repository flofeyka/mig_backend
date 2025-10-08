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
import { SuccessRdo } from 'common/rdo/success.rdo';
import { FlowService } from './flow.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { FlowRdo } from './rdo/flow.rdo';
import { FlowsRdo } from './rdo/flows.rdo';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { AuthJwtGuard } from 'src/auth/auth.guard';
import { PageDto } from 'common/dto/page.dto';

@ApiTags('Flow')
@ApiBearerAuth()
@Controller('/flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @ApiOperation({ summary: 'Create new flow' })
  @ApiOkResponse({ type: FlowRdo })
  @UseGuards(AuthJwtGuard)
  @Post()
  createFlow(@Body() dto: CreateFlowDto): Promise<FlowRdo> {
    return this.flowService.createFlow(dto);
  }

  @ApiOperation({ summary: 'Get all flows' })
  @ApiOkResponse({ type: FlowsRdo })
  @Get('/all')
  getAllFlows(@Query() dto: PageDto): Promise<FlowsRdo> {
    return this.flowService.getAllFlows(dto?.page, dto?.limit);
  }

  @ApiOperation({ summary: 'Get flow by id' })
  @ApiOkResponse({ type: FlowRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Flow not found').getResponse(),
  })
  @Get('/:id')
  getFlowById(
    @Param('id') id: string,
    @Query() dto: PageDto,
  ): Promise<FlowRdo> {
    return this.flowService.getFlowById(id, dto);
  }

  @ApiOperation({ summary: 'Update flow by id' })
  @ApiOkResponse({ type: FlowRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Flow not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard)
  @Put('/:id')
  updateFlow(
    @Param('id') id: string,
    @Body() dto: UpdateFlowDto,
  ): Promise<FlowRdo> {
    return this.flowService.updateFlow(id, dto);
  }

  @ApiOperation({ summary: 'Delete flow by id' })
  @ApiOkResponse({ type: SuccessRdo })
  @ApiNotFoundResponse({
    example: new NotFoundException('Flow not found').getResponse(),
  })
  @UseGuards(AuthJwtGuard)
  @Delete('/:id')
  deleteFlow(@Param('id') id: string): Promise<SuccessRdo> {
    return this.flowService.deleteFlow(id);
  }
}
