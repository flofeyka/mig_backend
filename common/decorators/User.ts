import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { fillDto } from 'common/utils/fillDto';
import { UserRdo } from 'src/user/rdo/user.rdo';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserRdo => {
    const request = ctx.switchToHttp().getRequest();
    return fillDto(UserRdo, request.user);
  },
);
