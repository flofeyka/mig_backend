import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CustomRequest } from 'common/types/Request';
import { Observable } from 'rxjs';
import { EventService } from '../event.service';
import { TokenService } from 'src/auth/token/token.service';

@Injectable()
export class EventAccessGuard implements CanActivate {
  constructor(
    private readonly eventService: EventService,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request: CustomRequest = context.switchToHttp().getRequest();

      const bearerToken = request.headers.authorization;

      if (!bearerToken) return true;

      const token = bearerToken.split(' ')[1];

      const user = await this.tokenService.validateAccessToken(token);

      const userId = user.id;
      const eventId = request.params.id || request.body.id || request.query.id;

      request.hasUserAccess = await this.eventService.checkUserAccess(
        userId,
        eventId,
      );
    } catch (e) {
      console.error(e);
    }

    return true;
  }
}
