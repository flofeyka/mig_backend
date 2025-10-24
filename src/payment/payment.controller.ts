import { Controller, Get, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { SuccessRdo } from 'common/rdo/success.rdo';
import { PaymentStatus } from '@prisma/client';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

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
