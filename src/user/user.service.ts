import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRdo } from './rdo/user.rdo';
import { User } from '@prisma/client';
import { fillDto } from 'common/utils/fillDto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    return await this.prisma.user.create({ data: dto });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async findUserByLogin(login: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { login } });
  }

  async editUserData(id: number, dto: UpdateUserDto): Promise<UserRdo> {
    try {
      const user = await this.prisma.user.update({ where: { id }, data: dto });

      return fillDto(UserRdo, user);
    } catch (e) {
      console.error(e);
      throw new BadRequestException(
        `User with this ${dto.email || dto.login} value already exists`,
      );
    }
  }
}
