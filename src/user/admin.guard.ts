import {
  BadGatewayException,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CustomRequest } from '../../common/types/Request';

export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: CustomRequest = context.switchToHttp().getRequest();

    if (!request.user.isAdmin) {
      throw new BadGatewayException(
        'You have not got permissions for this action',
      );
    }

    return true;
  }
}
