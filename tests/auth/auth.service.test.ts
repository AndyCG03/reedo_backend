import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../src/modules/auth/auth.service';
import { User } from '../../src/modules/users/domain/user';
import type { UserRepository } from '../../src/modules/users/domain/user.repository';
import type { RefreshTokenRepository } from '../../src/modules/auth/domain/refresh-token.repository';
import { RefreshToken } from '../../src/modules/auth/domain/refresh-token';
import * as argon2 from 'argon2';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return new User(
    overrides.id ?? 'user-uuid-1',
    overrides.username ?? 'testuser',
    overrides.email ?? 'test@example.com',
    overrides.bio ?? null,
    overrides.avatarUrl ?? null,
    overrides.passwordHash ?? null, // passwordHash — set per test
    overrides.role ?? 'USER',
    overrides.createdAt ?? new Date(),
    overrides.updatedAt ?? new Date(),
  );
}

function mockUserRepo(): jest.Mocked<UserRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findMany: jest.fn(),
  };
}

function mockRefreshTokenRepo(): jest.Mocked<RefreshTokenRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByHash: jest.fn(),
    revokeById: jest.fn(),
    revokeAllForUser: jest.fn(),
  };
}

function makeMockJwtService(): jest.Mocked<JwtService> {
  return {
    sign: jest.fn().mockReturnValue('signed-access-token'),
  } as unknown as jest.Mocked<JwtService>;
}

function makeMockConfigService(): jest.Mocked<ConfigService> {
  return {
    get: jest.fn().mockImplementation((key: string) => {
      const cfg: Record<string, string> = {
        'jwt.secret': 'test-secret',
        'jwt.expiresIn': '15m',
        'jwt.refreshExpiresIn': '30d',
      };
      return cfg[key];
    }),
  } as unknown as jest.Mocked<ConfigService>;
}

function makeService(
  userRepo: UserRepository,
  refreshRepo: RefreshTokenRepository,
  jwt?: jest.Mocked<JwtService>,
  config?: jest.Mocked<ConfigService>,
): AuthService {
  return new AuthService(
    userRepo,
    refreshRepo,
    jwt ?? makeMockJwtService(),
    config ?? makeMockConfigService(),
  );
}

// ── Register ───────────────────────────────────────────────────────────────────

describe('AuthService — register', () => {
  it('creates a user and returns tokens', async () => {
    const userRepo = mockUserRepo();
    const refreshRepo = mockRefreshTokenRepo();

    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.findByUsername.mockResolvedValue(null);
    userRepo.create.mockImplementation(async (u) => u);
    refreshRepo.create.mockImplementation(async (t) => t);

    const service = makeService(userRepo, refreshRepo);
    const result = await service.register({
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123!',
    });

    expect(result.accessToken).toBe('signed-access-token');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken).toContain('.'); // sessionId.secret format
    expect(userRepo.create).toHaveBeenCalledTimes(1);
    expect(refreshRepo.create).toHaveBeenCalledTimes(1);
  });

  it('throws ConflictException when email is already taken', async () => {
    const userRepo = mockUserRepo();
    const refreshRepo = mockRefreshTokenRepo();

    userRepo.findByEmail.mockResolvedValue(makeUser());
    userRepo.findByUsername.mockResolvedValue(null);

    const service = makeService(userRepo, refreshRepo);
    await expect(
      service.register({ username: 'other', email: 'test@example.com', password: 'Password123!' }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws ConflictException when username is already taken', async () => {
    const userRepo = mockUserRepo();
    const refreshRepo = mockRefreshTokenRepo();

    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.findByUsername.mockResolvedValue(makeUser());

    const service = makeService(userRepo, refreshRepo);
    await expect(
      service.register({ username: 'testuser', email: 'new@example.com', password: 'Password123!' }),
    ).rejects.toThrow(ConflictException);
  });
});

// ── Login ──────────────────────────────────────────────────────────────────────

describe('AuthService — login', () => {
  it('returns tokens for valid credentials', async () => {
    const userRepo = mockUserRepo();
    const refreshRepo = mockRefreshTokenRepo();

    const hash = await argon2.hash('Password123!');
    const user = new User('user-uuid-1', 'testuser', 'test@example.com', null, null, hash, 'USER', new Date(), new Date());

    userRepo.findByEmail.mockResolvedValue(user);
    refreshRepo.create.mockImplementation(async (t) => t);

    const service = makeService(userRepo, refreshRepo);
    const result = await service.login('test@example.com', 'Password123!');

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).toContain('.');
  });

  it('throws UnauthorizedException for wrong password', async () => {
    const userRepo = mockUserRepo();
    const refreshRepo = mockRefreshTokenRepo();

    const hash = await argon2.hash('CorrectPassword!');
    const user = new User('user-uuid-1', 'testuser', 'test@example.com', null, null, hash, 'USER', new Date(), new Date());

    userRepo.findByEmail.mockResolvedValue(user);

    const service = makeService(userRepo, refreshRepo);
    await expect(service.login('test@example.com', 'WrongPassword!')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when user does not exist', async () => {
    const userRepo = mockUserRepo();
    const refreshRepo = mockRefreshTokenRepo();

    userRepo.findByEmail.mockResolvedValue(null);

    const service = makeService(userRepo, refreshRepo);
    await expect(service.login('ghost@example.com', 'any')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

// ── Refresh ────────────────────────────────────────────────────────────────────

describe('AuthService — refresh', () => {
  it('rotates the session and returns new tokens', async () => {
    const userRepo = mockUserRepo();
    const refreshRepo = mockRefreshTokenRepo();
    refreshRepo.create.mockImplementation(async (t) => t);

    const secret = 'somesecret';
    const hash = await argon2.hash(secret);
    const session = new RefreshToken(
      'session-uuid',
      'user-uuid-1',
      hash,
      new Date(Date.now() + 86_400_000),
      new Date(),
      null,
    );

    refreshRepo.findById.mockResolvedValue(session);

    const service = makeService(userRepo, refreshRepo);
    const rawToken = `session-uuid.${secret}`;
    const result = await service.refresh(rawToken);

    expect(result.accessToken).toBe('signed-access-token');
    expect(refreshRepo.revokeById).toHaveBeenCalledWith('session-uuid');
    expect(refreshRepo.create).toHaveBeenCalledTimes(1);
  });

  it('throws UnauthorizedException for expired session', async () => {
    const userRepo = mockUserRepo();
    const refreshRepo = mockRefreshTokenRepo();

    const secret = 'somesecret';
    const hash = await argon2.hash(secret);
    const expired = new RefreshToken(
      'session-uuid',
      'user-uuid-1',
      hash,
      new Date(Date.now() - 1000), // expired
      new Date(),
      null,
    );

    refreshRepo.findById.mockResolvedValue(expired);

    const service = makeService(userRepo, refreshRepo);
    await expect(service.refresh(`session-uuid.${secret}`)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException for wrong secret', async () => {
    const userRepo = mockUserRepo();
    const refreshRepo = mockRefreshTokenRepo();

    const hash = await argon2.hash('correct-secret');
    const session = new RefreshToken(
      'session-uuid',
      'user-uuid-1',
      hash,
      new Date(Date.now() + 86_400_000),
      new Date(),
      null,
    );

    refreshRepo.findById.mockResolvedValue(session);

    const service = makeService(userRepo, refreshRepo);
    await expect(service.refresh('session-uuid.wrong-secret')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException for malformed token', async () => {
    const service = makeService(mockUserRepo(), mockRefreshTokenRepo());
    await expect(service.refresh('no-dot-here')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

// ── Logout ─────────────────────────────────────────────────────────────────────

describe('AuthService — logout', () => {
  it('revokes the session', async () => {
    const userRepo = mockUserRepo();
    const refreshRepo = mockRefreshTokenRepo();

    const secret = 'somesecret';
    const hash = await argon2.hash(secret);
    const session = new RefreshToken(
      'session-uuid',
      'user-uuid-1',
      hash,
      new Date(Date.now() + 86_400_000),
      new Date(),
      null,
    );

    refreshRepo.findById.mockResolvedValue(session);

    const service = makeService(userRepo, refreshRepo);
    await service.logout(`session-uuid.${secret}`);

    expect(refreshRepo.revokeById).toHaveBeenCalledWith('session-uuid');
  });

  it('silently ignores malformed tokens', async () => {
    const refreshRepo = mockRefreshTokenRepo();
    const service = makeService(mockUserRepo(), refreshRepo);
    await expect(service.logout('nodot')).resolves.toBeUndefined();
    expect(refreshRepo.revokeById).not.toHaveBeenCalled();
  });
});
