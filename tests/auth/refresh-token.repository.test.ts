import { PrismaRefreshTokenRepository } from '../../src/modules/auth/infrastructure/persistence/prisma/prisma-refresh-token.repository';
import { RefreshToken } from '../../src/modules/auth/domain/refresh-token';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('PrismaRefreshTokenRepository', () => {
  let repository: PrismaRefreshTokenRepository;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    repository = new PrismaRefreshTokenRepository(prisma);
  });

  describe('create', () => {
    it('creates a refresh token', async () => {
      const token = new RefreshToken(
        'token-1',
        'user-1',
        'hash123',
        new Date('2026-01-02'),
        new Date('2026-01-01'),
        null,
      );

      prisma.refreshToken.create.mockResolvedValue({} as any);

      const result = await repository.create(token);

      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result).toEqual(token);
    });
  });

  describe('findById', () => {
    it('returns token when found', async () => {
      const record = {
        id: 'token-1',
        userId: 'user-1',
        tokenHash: 'hash123',
        expiresAt: new Date('2026-01-02'),
        createdAt: new Date('2026-01-01'),
        revokedAt: null,
      };

      prisma.refreshToken.findUnique.mockResolvedValue(record);

      const result = await repository.findById('token-1');

      expect(prisma.refreshToken.findUnique).toHaveBeenCalled();
      expect(result).toBeInstanceOf(RefreshToken);
      expect(result?.id).toBe('token-1');
    });

    it('returns null when not found', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByHash', () => {
    it('returns token when found by hash', async () => {
      const record = {
        id: 'token-1',
        userId: 'user-1',
        tokenHash: 'hash123',
        expiresAt: new Date('2026-01-02'),
        createdAt: new Date('2026-01-01'),
        revokedAt: null,
      };

      prisma.refreshToken.findFirst.mockResolvedValue(record);

      const result = await repository.findByHash('hash123');

      expect(prisma.refreshToken.findFirst).toHaveBeenCalled();
      expect(result).toBeInstanceOf(RefreshToken);
    });

    it('returns null when hash not found', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(null);

      const result = await repository.findByHash('unknown-hash');

      expect(result).toBeNull();
    });
  });

  describe('revokeById', () => {
    it('revokes token by id', async () => {
      prisma.refreshToken.update.mockResolvedValue({} as any);

      await repository.revokeById('token-1');

      expect(prisma.refreshToken.update).toHaveBeenCalled();
    });
  });

  describe('revokeAllForUser', () => {
    it('revokes all non-revoked tokens for user', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 5 } as any);

      await repository.revokeAllForUser('user-1');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });
});
