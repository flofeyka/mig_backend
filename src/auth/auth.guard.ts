import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from './token/token.service';

@Injectable()
export class AuthJwtGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();

      const bearerToken = request.headers.authorization;
      const token = bearerToken.split(' ')[1];

      const tokenVerified = await this.tokenService.validateAccessToken(token);

      if (!tokenVerified) {
        throw new UnauthorizedException('Unauthorized');
      }

      request.user = tokenVerified;
      return true;
    } catch (e) {
      console.error(e);
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
