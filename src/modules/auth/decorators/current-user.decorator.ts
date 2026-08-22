import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/domain/user';

/**
 * Param decorator that extracts the authenticated user from request.user.
 *
 * Usage:
 *   public myRoute(@CurrentUser() user: User) { ... }
 *
 * Requires JwtAuthGuard to be active on the route.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
