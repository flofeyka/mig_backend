import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Token } from '@prisma/client';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { fillDto } from 'common/utils/fillDto';
import { PrismaService } from 'prisma/prisma.service';
import { UserRdo } from 'src/user/rdo/user.rdo';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}
  async generateTokens(payload: UserRdo): Promise<string[]> {
    const tokens = await Promise.all([
      this.jwtService.sign(payload, { expiresIn: '15m' }),
      this.jwtService.sign(payload, { expiresIn: '14d' }),
    ]);

    return tokens;
  }

  async saveRefreshToken(userId: number, token: string): Promise<Token> {
    return await this.prisma.token.upsert({
      create: { userId, token },
      update: { token },
      where: { userId },
    });
  }

  async validateAccessToken(accessToken: string): Promise<UserRdo> {
    return await this.jwtService.verify(accessToken);
  }

  async validateRefreshToken(token: string): Promise<UserRdo | null> {
    const tokenFound = await this.prisma.token.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!tokenFound) {
      return null;
    }

    return instanceToPlain(fillDto(UserRdo, tokenFound.user)) as UserRdo;
  }
}
