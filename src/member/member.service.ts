import { Injectable, NotFoundException } from '@nestjs/common';
import { MemberRdo } from './rdo/member.rdo';
import { PrismaService } from 'prisma/prisma.service';
import { fillDto } from 'common/utils/fillDto';
import { CreateMemberDto } from './dto/create-member.dto';
import { MembersRdo } from './rdo/members.rdo';
import { UpdateMemberDto } from './dto/update-member.dto';
import { StorageService } from 'src/storage/storage.service';
import { StorageType } from 'src/storage/storage.interface';

@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService, private readonly storageService: StorageService) { }

  async createMember(dto: CreateMemberDto): Promise<MemberRdo> {
    const member = await this.prisma.member.create({
      data: {
        speechId: dto.speechId,
      },
    });

    return fillDto(MemberRdo, member);
  }

  async getAllMembers(
    speechId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<MembersRdo> {
    const where = {speechId};
    const [total, members] = await this.prisma.$transaction([
      this.prisma.member.count({where}),
      this.prisma.member.findMany({
        where,
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
        ...(userId && {
          buyers: {
            where: { id: userId },
          },
        }),
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    return fillDto(MemberRdo, {
      ...member,
      media: await Promise.all(member.media.map(async (media) => {
        const hasBoughtMedia = media.orderMedia?.length > 0;
        const hasAccessToMembers = member.buyers?.length > 0;

        return {
          ...media,
          fullVersion:
            hasBoughtMedia || hasAccessToMembers
              ? await this.storageService.getPresignedUrl(media.filename, { storageType: StorageType.S3, folder: `/original/${media.memberId}` })
              : undefined,
        };
      })),
    });
  }

  async downloadMember(id: string, userId: number): Promise<NodeJS.ReadableStream> {
    const member = await this.prisma.member.findUnique({ where: { id, buyers: { some: { id: userId } } } });

    if(!member) throw new NotFoundException('Member not found');

    return await this.storageService.getFolderAsZip('original' + '/' + member.id, StorageType.S3);
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
