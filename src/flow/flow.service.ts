import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { FlowRdo } from './rdo/flow.rdo';
import { fillDto } from 'common/utils/fillDto';
import { FlowsRdo } from './rdo/flows.rdo';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { SuccessRdo } from 'common/rdo/success.rdo';
import { PageDto } from 'common/dto/page.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FlowService {
  constructor(private readonly prisma: PrismaService) {}

  async createFlow(dto: CreateFlowDto): Promise<FlowRdo> {
    const flow = await this.prisma.flow.create({
      data: { ...dto, from: new Date(dto.from), to: new Date(dto.to) },
    });
    return fillDto(FlowRdo, flow);
  }

  async getAllFlows(eventId: string, page: number = 1, limit: number = 10): Promise<FlowsRdo> {
    const where = {eventId};
    const [total, flows] = await this.prisma.$transaction([
      this.prisma.flow.count({where}),
      this.prisma.flow.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return fillDto(FlowsRdo, { total, flows });
  }

  async getFlowById(id: string, dto: PageDto): Promise<FlowRdo> {
    const flow = await this.prisma.flow.findUnique({
      where: { id },
      include: { speeches: true },
    });

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    return fillDto(FlowRdo, flow);
  }

  async getFlow(id: string): Promise<FlowRdo> {
    const flow = await this.prisma.flow.findUnique({
      where: { id },
      include: { speeches: true },
    });

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    return fillDto(FlowRdo, flow);
  }

  async updateFlow(id: string, dto: UpdateFlowDto): Promise<FlowRdo> {
    const existing = await this.prisma.flow.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Flow not found');
    }

    const updateData: Prisma.FlowUpdateInput = dto;

    if (dto.from) {
      updateData.from = new Date(dto.from);
    }

    if (dto.to) {
      updateData.to = new Date(dto.to);
    }

    const updated = await this.prisma.flow.update({
      where: { id },
      data: updateData,
    });

    return fillDto(FlowRdo, updated);
  }

  async deleteFlow(id: string): Promise<SuccessRdo> {
    const existing = await this.prisma.flow.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Flow not found');
    }

    await this.prisma.flow.delete({ where: { id } });

    return fillDto(SuccessRdo, { success: true });
  }
}
