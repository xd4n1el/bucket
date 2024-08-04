import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { response } from '@utils/functions';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminKey: string = process.env.ADMIN_KEY;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['x-admin-key'];

    if (key !== this.adminKey) {
      throw new UnauthorizedException(
        response({ message: 'Invalid admin key.', data: key, error: true }),
      );
    }

    return true;
  }
}
