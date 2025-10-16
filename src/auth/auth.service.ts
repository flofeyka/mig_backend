import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token/token.service';
import { fillDto } from 'common/utils/fillDto';
import { UserRdo } from 'src/user/rdo/user.rdo';
import { AuthRdo } from './rdo/auth-rdo';
import bcrypt from 'bcrypt';
import { instanceToPlain } from 'class-transformer';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}
  async signIn(dto: AuthDto): Promise<AuthRdo> {
    const user = await this.userService.findUserByLogin(dto.login);

    if (!user) {
      throw new UnauthorizedException('Wrong login or password');
    }

    const passwordCompare = await bcrypt.compare(dto.password, user.password);

    if (!passwordCompare) {
      throw new UnauthorizedException('Wrong login or password');
    }

    const [accessToken, refreshToken] = await this.tokenService.generateTokens(
      instanceToPlain(fillDto(UserRdo, user)) as UserRdo,
    );
    await this.tokenService.saveRefreshToken(user.id, refreshToken);

    return fillDto(AuthRdo, { user, accessToken, refreshToken });
  }

  async signUp(dto: SignUpDto): Promise<AuthRdo> {
    const userExists = await this.userService.findUserByLogin(dto.login);

    if (userExists) {
      throw new BadRequestException('User with this login already exists');
    }

    const user = await this.userService.createUser({
      ...dto,
      password: await bcrypt.hash(dto.password, 10),
    });

    const [accessToken, refreshToken] = await this.tokenService.generateTokens(
      instanceToPlain(fillDto(UserRdo, user)) as UserRdo,
    );
    await this.tokenService.saveRefreshToken(user.id, refreshToken);

    return fillDto(AuthRdo, { user, accessToken, refreshToken });
  }

  async refreshToken(token: string) {
    const user = await this.tokenService.validateRefreshToken(token);

    if (!user) {
      throw new UnauthorizedException('Token invalid');
    }

    const [accessToken, refreshToken] =
      await this.tokenService.generateTokens(user);
    await this.tokenService.saveRefreshToken(user.id, refreshToken);

    return fillDto(AuthRdo, { accessToken, refreshToken, user });
  }
}
