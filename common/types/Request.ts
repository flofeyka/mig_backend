import { Request } from 'express';
import { UserRdo } from 'src/user/rdo/user.rdo';

export interface CustomRequest extends Request {
  user: UserRdo;
  hasUserAccess?: boolean;
}
