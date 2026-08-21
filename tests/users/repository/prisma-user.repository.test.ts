import { PrismaService } from '../../../src/prisma/prisma.service';
import { User } from '../../../src/modules/users/domain/user';
import { PrismaUserRepository } from '../../../src/modules/users/infrastructure/persistence/prisma/prisma-user.repository';

describe('PrismaUserRepository', () => {
  let prisma: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let adapter: PrismaUserRepository;

  beforeEach(() => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    adapter = new PrismaUserRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('persists the domain model through the Prisma adapter', async () => {
      const user = User.create({
        id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
        username: 'bookworm',
        email: 'bookworm@example.com',
        bio: null,
        avatarUrl: null,
      });
      prisma.user.create.mockResolvedValue({});

      const result = await adapter.create(user);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          id: user.id,
          username: 'bookworm',
          email: 'bookworm@example.com',
          bio: null,
          avatarUrl: null,
        },
      });
      expect(result).toEqual(user);
    });
  });

  describe('findById', () => {
    it('maps the persisted record back to the domain model', async () => {
      const record = {
        id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
        username: 'bookworm',
        email: 'bookworm@example.com',
        bio: 'I love books',
        avatarUrl: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      prisma.user.findUnique.mockResolvedValue(record);

      const result = await adapter.findById(record.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: record.id },
      });
      expect(result).toEqual(
        new User(
          record.id,
          record.username,
          record.email,
          record.bio,
          record.avatarUrl,
          record.createdAt,
          record.updatedAt,
        ),
      );
    });

    it('returns null when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await adapter.findById('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('maps the persisted record back to the domain model', async () => {
      const record = {
        id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
        username: 'bookworm',
        email: 'bookworm@example.com',
        bio: null,
        avatarUrl: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      prisma.user.findUnique.mockResolvedValue(record);

      const result = await adapter.findByUsername('bookworm');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'bookworm' },
      });
      expect(result).toEqual(
        new User(
          record.id,
          record.username,
          record.email,
          record.bio,
          record.avatarUrl,
          record.createdAt,
          record.updatedAt,
        ),
      );
    });

    it('returns null when the username is not registered', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await adapter.findByUsername('ghost');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('delegates to PrismaSieve and maps records to the domain', async () => {
      const record = {
        id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
        username: 'bookworm',
        email: 'bookworm@example.com',
        bio: null,
        avatarUrl: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      prisma.user.findMany.mockResolvedValue([record]);
      prisma.user.count.mockResolvedValue(1);
      prisma.$transaction.mockResolvedValue([[record], 1]);

      const result = await adapter.findMany({ page: 1, pageSize: 20 });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.data[0]).toEqual(
        new User(
          record.id,
          record.username,
          record.email,
          record.bio,
          record.avatarUrl,
          record.createdAt,
          record.updatedAt,
        ),
      );
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.pageSize).toBe(20);
    });
  });
});
