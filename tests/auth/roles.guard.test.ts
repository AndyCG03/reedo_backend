import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../src/modules/auth/guards/roles.guard';
import { User } from '../../src/modules/users/domain/user';
import { ROLES_KEY } from '../../src/modules/auth/decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: User): ExecutionContext => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
    return context;
  };

  describe('when no roles are required', () => {
    it('allows access', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockContext();

      expect(guard.canActivate(context)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('allows access when roles array is empty', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const context = createMockContext();

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('when roles are required', () => {
    it('allows access if user has required role', () => {
      const user = new User(
        'user-1',
        'admin',
        'admin@example.com',
        null,
        null,
        null,
        'ADMIN',
        new Date(),
        new Date(),
      );
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockContext(user);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('allows access if user has one of multiple required roles', () => {
      const user = new User(
        'user-1',
        'admin',
        'admin@example.com',
        null,
        null,
        null,
        'ADMIN',
        new Date(),
        new Date(),
      );
      reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'USER']);
      const context = createMockContext(user);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('denies access if user does not have required role', () => {
      const user = new User(
        'user-1',
        'regular',
        'user@example.com',
        null,
        null,
        null,
        'USER',
        new Date(),
        new Date(),
      );
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockContext(user);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('denies access if no user is authenticated', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockContext(undefined);

      expect(guard.canActivate(context)).toBe(false);
    });
  });

  describe('metadata retrieval', () => {
    it('checks both handler and class for roles metadata', () => {
      reflector.getAllAndOverride.mockReturnValue(['USER']);
      const context = createMockContext();

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});
