import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { SuccessRdo } from 'common/rdo/success.rdo';
import { PaymentStatus } from '@prisma/client';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AuthJwtGuard } from '../auth/auth.guard';
import { User } from '../../common/decorators/User';
import { UserRdo } from '../user/rdo/user.rdo';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({ summary: 'Create a payment order' })
  @ApiOkResponse({ example: '' })
  @UseGuards(AuthJwtGuard)
  @Post('/')
  createPaymentOrder(
    @User() user: UserRdo,
    @Body() dto: CreatePaymentOrderDto,
  ): Promise<string> {
    return this.paymentService.generatePaymentUrl(
      user.id,
      dto.medias,
      dto.speeches,
      `Покупка ${dto.medias?.length || 0} фотографий и ${dto.speeches?.length} выступлений`,
    );
  }

  @Get('success')
  @Redirect(process.env.SUCCESS_REDIRECT_URL, 301)
  async success(@Query() query: PaymentWebhookDto): Promise<SuccessRdo> {
    return this.paymentService.processPayment(
      query.InvId,
      query.SignatureValue,
      PaymentStatus.SUCCESS,
    );
  }

  @Get('fail')
  fail(@Query() query: PaymentWebhookDto): Promise<SuccessRdo> {
    return this.paymentService.processPayment(
      query.InvId,
      query.SignatureValue,
      PaymentStatus.FAILED,
    );
  }
}
