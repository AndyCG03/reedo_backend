import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../src/modules/auth/strategies/jwt.strategy';
import { AuthService, JwtPayload } from '../../src/modules/auth/auth.service';
import { User } from '../../src/modules/users/domain/user';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as jest.Mocked<ConfigService>;

    authService = {
      validatePayload: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    strategy = new JwtStrategy(configService, authService);
  });

  it('should be configured with correct options', () => {
    expect(strategy).toBeDefined();
    expect(configService.get).toHaveBeenCalledWith('jwt.secret');
  });

  describe('validate', () => {
    it('returns user when payload is valid', async () => {
      const payload: JwtPayload = { sub: 'user-123', type: 'access' };
      const user = new User(
        'user-123',
        'testuser',
        'test@example.com',
        null,
        null,
        null,
        'USER',
        new Date(),
        new Date(),
      );

      authService.validatePayload.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(result).toEqual(user);
      expect(authService.validatePayload).toHaveBeenCalledWith(payload);
    });

    it('throws UnauthorizedException when user not found', async () => {
      const payload: JwtPayload = { sub: 'nonexistent-user', type: 'access' };

      authService.validatePayload.mockRejectedValue(
        new UnauthorizedException('User not found.'),
      );

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(authService.validatePayload).toHaveBeenCalledWith(payload);
    });

    it('throws UnauthorizedException when service throws', async () => {
      const payload: JwtPayload = { sub: 'user-123', type: 'access' };

      authService.validatePayload.mockRejectedValue(
        new UnauthorizedException('Invalid token.'),
      );

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
