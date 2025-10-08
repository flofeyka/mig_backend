import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from './token/token.service';
import { Reflector } from '@nestjs/core';
import { IS_OPTIONAL_AUTH } from 'common/decorators/OptionalAuth';

@Injectable()
export class AuthJwtGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest();
    try {
      const bearerToken = request.headers.authorization;
      const token = bearerToken.split(' ')[1];

      const tokenVerified = await this.tokenService.validateAccessToken(token);

      if (!tokenVerified) {
        throw new UnauthorizedException('Unauthorized');
      }

      request.user = tokenVerified;
      return true;
    } catch (e) {
      if (isOptional) {
        request.user = undefined;
        return true;
      }
      console.error(e);
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
