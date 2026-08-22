import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator that specifies the required role(s) for accessing a route.
 *
 * Usage:
 *   @Roles('ADMIN')
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   public adminOnlyEndpoint() { ... }
 *
 * Can also accept multiple roles:
 *   @Roles('ADMIN', 'MODERATOR')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
