import { Injectable, NotFoundException } from '@nestjs/common';
import { MemberRdo } from './rdo/member.rdo';
import { PrismaService } from 'prisma/prisma.service';
import { fillDto } from 'common/utils/fillDto';
import { CreateMemberDto } from './dto/create-member.dto';
import { MembersRdo } from './rdo/members.rdo';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService) {}

  async createMember(dto: CreateMemberDto): Promise<MemberRdo> {
    const member = await this.prisma.member.create({
      data: {
        speechId: dto.speechId,
      },
    });

    return fillDto(MemberRdo, member);
  }

  async getAllMembers(
    page: number = 1,
    limit: number = 10,
  ): Promise<MembersRdo> {
    const [total, members] = await this.prisma.$transaction([
      this.prisma.member.count(),
      this.prisma.member.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          media: {
            take: 1,
          },
        },
      }),
    ]);

    return fillDto(MembersRdo, { members, total });
  }

  async getMemberById(
    id: string,
    userId?: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<MemberRdo> {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        media: {
          take: limit,
          skip: (page - 1) * limit,
          include: {
            ...(userId && {
              orderMedia: {
                where: {
                  buyers: {
                    some: { id: userId },
                  },
                },
              },
            }),
          },
        },
        speech: {
          select: {
            flow: {
              select: {
                event: {
                  include: {
                    ...(userId && {
                      buyers: {
                        where: { id: userId },
                      },
                    }),
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    return fillDto(MemberRdo, {
      ...member,
      media: member.media.map((media) => {
        const hasBoughtMedia = media.orderMedia?.length > 0;
        const hasAccessToSpeech = member.speech.flow.event.buyers?.length > 0;

        return {
          ...media,
          fullVersion:
            hasBoughtMedia || hasAccessToSpeech ? media.fullVersion : undefined,
        };
      }),
    });
  }

  async updateMember(
    id: string,
    dto: UpdateMemberDto,
    files?: Express.Multer.File[],
  ): Promise<MemberRdo> {
    const existing = await this.prisma.member.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    const updated = await this.prisma.member.update({
      where: { id },
      data: {
        ...dto,
      },
    });

    return fillDto(MemberRdo, updated);
  }

  async deleteMember(id: string): Promise<MemberRdo> {
    const existing = await this.prisma.member.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    const deleted = await this.prisma.member.delete({ where: { id } });
    return fillDto(MemberRdo, deleted);
  }
}
