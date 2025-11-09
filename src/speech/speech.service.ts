import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateSpeechDto } from './dto/create-speech.dto';
import { SpeechRdo } from './rdo/speech.rdo';
import { fillDto } from 'common/utils/fillDto';
import { SpeechesRdo } from './rdo/speeches.rdo';
import { UpdateSpeechDto } from './dto/update-speech.dto';
import { SuccessRdo } from '../../common/rdo/success.rdo';

@Injectable()
export class SpeechService {
  constructor(private readonly prisma: PrismaService) {}

  async createSpeech(dto: CreateSpeechDto): Promise<SpeechRdo> {
    const speech = await this.prisma.speech.create({ data: dto });
    return fillDto(SpeechRdo, speech);
  }

  async getAllSpeeches(
    flowId: string,
    page: number = 1,
    limit: number = 15,
  ): Promise<SpeechesRdo> {
    const [total, speeches] = await this.prisma.$transaction([
      this.prisma.speech.count({ where: { flowId } }),
      this.prisma.speech.findMany({
        where: { flowId },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return fillDto(SpeechesRdo, { speeches, total });
  }

  async buySpeech(speechId: string): Promise<SuccessRdo> {
    return fillDto(SuccessRdo, { success: true });
  }

  async getSpeechById(id: string): Promise<SpeechRdo> {
    const speech = await this.prisma.speech.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!speech) {
      throw new NotFoundException('Speech not found');
    }

    return fillDto(SpeechRdo, speech);
  }

  async updateSpeech(id: string, dto: UpdateSpeechDto): Promise<SpeechRdo> {
    const existing = await this.prisma.speech.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Speech not found');
    }

    const updated = await this.prisma.speech.update({
      where: { id },
      data: dto,
    });

    return fillDto(SpeechRdo, updated);
  }

  async deleteSpeech(id: string): Promise<void> {
    const existing = await this.prisma.speech.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Speech not found');
    }

    await this.prisma.speech.delete({ where: { id } });
  }
}
