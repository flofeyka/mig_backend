import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { SuccessRdo } from 'common/rdo/success.rdo';

export class SuccessPaymentLinkRdo extends SuccessRdo {
  @ApiProperty({
    title: 'Payment url',
    example:
      'https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=fotomig33&OutSum=123&InvId=12324645614881488&Description=%D0%9E%D0%BF%D0%BB%D0%B0%D1%82%D0%B0+%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7%D0%B0+12324645614881488&SignatureValue=c9538143410eafbde86ce20268705dfb&IsTest=1&Culture=ru',
  })
  @IsString()
  @Expose()
  url: string;
}
