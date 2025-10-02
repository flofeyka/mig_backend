import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CustomRequest } from 'common/types/Request';

export const EventAccess = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<boolean> => {
    const request: CustomRequest = ctx.switchToHttp().getRequest();

    return !!request.hasUserAccess;
  },
);
