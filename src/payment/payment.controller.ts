import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
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
    const mediasAmount = (dto.medias || []).length * 400;
    const speechesAmount = dto.speeches?.reduce(
      (prev, acc, index) =>
        prev + (index === 0 ? 2000 : index === 1 ? 1000 : 1500),
      0,
    );

    return this.paymentService.generatePaymentUrl(
      mediasAmount + speechesAmount,
      user.id,
      dto.medias,
      dto.speeches,
      `Покупка ${dto.medias?.length || 0} фотографий и ${dto.speeches.length} выступлений`,
    );
  }

  @Get('success')
  success(@Query() query: PaymentWebhookDto): Promise<SuccessRdo> {
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
