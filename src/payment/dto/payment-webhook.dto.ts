import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PaymentWebhookDto {
  @ApiProperty({ title: 'Payment order ID', description: 'Payment order ID' })
  @IsString()
  InvId: string;

  @ApiProperty({ title: 'Amount', description: 'Amount' })
  @IsString()
  OutSum: string;

  @ApiProperty({ title: 'Signature value', description: 'Signature value' })
  @IsString()
  SignatureValue: string;

  @ApiProperty({ title: 'Is test', description: 'Is test' })
  @IsOptional()
  @IsString()
  IsTest?: '1';

  @ApiProperty({ title: 'Payment culture', description: 'Payment culture' })
  @IsString()
  Culture: string;
}
