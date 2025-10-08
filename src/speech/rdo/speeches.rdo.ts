import { ApiProperty } from '@nestjs/swagger';
import { PageRdo } from 'common/rdo/page.rdo';
import { SpeechRdo } from './speech.rdo';
import { Expose } from 'class-transformer';

export class SpeechesRdo extends PageRdo {
  @ApiProperty({ title: 'Speeches list', type: [SpeechRdo] })
  @Expose()
  speeches: SpeechRdo;
}
