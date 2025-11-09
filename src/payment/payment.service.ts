import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order, OrderStatus, Payment, PaymentStatus } from '@prisma/client';
import { SuccessRdo } from 'common/rdo/success.rdo';
import { fillDto } from 'common/utils/fillDto';
import * as crypto from 'crypto';
import { PrismaService } from 'prisma/prisma.service';
import { randomInt } from 'node:crypto';
import { OrderService } from '../order/order.service';

@Injectable()
export class PaymentService {
  private readonly logger: Logger = new Logger();
  private readonly merchantLogin: string;
  private readonly password1: string;
  private readonly password2: string;
  private readonly robokassaUrl =
    'https://auth.robokassa.ru/Merchant/Index.aspx';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService,
  ) {
    this.merchantLogin = this.configService.get('ROBOKASSA_LOGIN', '');
    this.password1 = this.configService.get('ROBOKASSA_FIRST_PASSWORD', '');
    this.password2 = this.configService.get('ROBOKASSA_SECOND_PASSWORD', '');
  }

  async generatePaymentUrl(
    userId: number,
    medias: { id: string; requiresProcessing: boolean }[] = [],
    speeches: { id: string }[] = [],
    description: string,
  ): Promise<string> {
    try {
      const mediasAmount = (medias || []).length * 400;

      const foundSpeeches = (
        await Promise.all(
          speeches.map(({ id }) =>
            this.prisma.speech.findUnique({ where: { id } }),
          ),
        )
      ).filter((item) => !!item);

      const speechesAmount = foundSpeeches?.reduce(
        (prev, acc, index) =>
          prev +
          (acc.isGroup ? 2500 : index === 0 ? 2000 : index === 1 ? 1000 : 1500),
        0,
      );

      const amount = mediasAmount + speechesAmount;

      const invoiceId = String(randomInt(1, 1000000000));

      const signature = crypto
        .createHash('md5')
        .update(
          `${this.merchantLogin}:${amount}:${invoiceId}:${this.password1}`,
        )
        .digest('hex');

      await this.prisma.payment.create({
        data: {
          userId,
          amount,
          order: {
            create: {
              status: OrderStatus.WAITING_FOR_PAYMENT,
              orderMedia: {
                createMany: {
                  data: medias.map((media) => ({
                    mediaId: media.id,
                    requiresProcessing: media.requiresProcessing,
                  })),
                },
              },
              speeches: {
                connect: foundSpeeches.map((speech) => ({ id: speech.id })),
              },
            },
          },
          systemId: invoiceId,
          status: PaymentStatus.PENDING,
        },
      });

      const params = new URLSearchParams({
        MerchantLogin: this.merchantLogin,
        OutSum: amount.toString(),
        InvId: invoiceId,
        Description: description,
        photos: JSON.stringify(medias),
        SignatureValue: signature,
        IsTest: '1',
        Culture: 'ru',
      });

      return `${this.robokassaUrl}?${params.toString()}`;
    } catch (e) {
      this.logger.error(`Cannot create payment link: ${e}`);
      throw new NotFoundException('Media not found');
    }
  }

  async processPayment(
    systemId: string,
    signature: string,
    status: PaymentStatus,
  ): Promise<SuccessRdo> {
    const payment = await this.fetchPaymentBySystemId(systemId);

    if (!payment || !payment.order) {
      throw new NotFoundException('Payment not found');
    }
    const isSignatureValid = this.checkSignature(
      String(payment.amount),
      payment.systemId,
      signature,
    );

    if (!isSignatureValid) {
      throw new BadGatewayException('Invalid signature');
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status },
    });
    switch (status) {
      case PaymentStatus.SUCCESS: {
        await this.orderService.changeStatus(
          payment.order.id,
          OrderStatus.PENDING,
        );

        return fillDto(SuccessRdo, { success: true });
      }
      default:
        return fillDto(SuccessRdo, { success: false });
    }
  }

  async fetchPaymentBySystemId(
    systemId: string,
  ): Promise<(Payment & { order: Order | null }) | null> {
    return this.prisma.payment.findUnique({
      where: { systemId },
      include: { order: true },
    });
  }

  async fetchPayment(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  checkSignature(
    outSum: string,
    invId: string,
    signatureValue: string,
  ): boolean {
    const expected = crypto
      .createHash('md5')
      .update(`${(+outSum).toFixed(2)}:${invId}:${this.password1}`)
      .digest('hex');

    return expected === signatureValue;
  }
}
