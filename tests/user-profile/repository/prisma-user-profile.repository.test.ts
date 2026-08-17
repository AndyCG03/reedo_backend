import { PrismaService } from '../../../src/prisma/prisma.service';
import { UserProfile } from '../../../src/modules/user-profile/domain/user-profile';
import { PrismaUserProfileRepository } from '../../../src/modules/user-profile/infrastructure/persistence/prisma/prisma-user-profile.repository';

describe('PrismaUserProfileRepository', () => {
  let prisma: {
    userProfile: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let adapter: PrismaUserProfileRepository;

  beforeEach(() => {
    prisma = {
      userProfile: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    adapter = new PrismaUserProfileRepository(
      prisma as unknown as PrismaService,
    );
  });

  describe('create', () => {
    it('persists the domain model through the Prisma adapter', async () => {
      const profile = UserProfile.create({
        id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
        username: 'bookworm',
        displayName: 'Bookworm',
        bio: null,
        avatarUrl: null,
      });
      prisma.userProfile.create.mockResolvedValue({});

      const result = await adapter.create(profile);

      expect(prisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          id: profile.id,
          username: 'bookworm',
          displayName: 'Bookworm',
          bio: null,
          avatarUrl: null,
        },
      });
      expect(result).toEqual(profile);
    });
  });

  describe('findById', () => {
    it('maps the persisted record back to the domain model', async () => {
      const record = {
        id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
        username: 'bookworm',
        displayName: 'Bookworm',
        bio: 'I love books',
        avatarUrl: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      prisma.userProfile.findUnique.mockResolvedValue(record);

      const result = await adapter.findById(record.id);

      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { id: record.id },
      });
      expect(result).toEqual(
        new UserProfile(
          record.id,
          record.username,
          record.displayName,
          record.bio,
          record.avatarUrl,
          record.createdAt,
          record.updatedAt,
        ),
      );
    });

    it('returns null when the profile does not exist', async () => {
      prisma.userProfile.findUnique.mockResolvedValue(null);

      const result = await adapter.findById('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('maps the persisted record back to the domain model', async () => {
      const record = {
        id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
        username: 'bookworm',
        displayName: 'Bookworm',
        bio: null,
        avatarUrl: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      prisma.userProfile.findUnique.mockResolvedValue(record);

      const result = await adapter.findByUsername('bookworm');

      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { username: 'bookworm' },
      });
      expect(result).toEqual(
        new UserProfile(
          record.id,
          record.username,
          record.displayName,
          record.bio,
          record.avatarUrl,
          record.createdAt,
          record.updatedAt,
        ),
      );
    });

    it('returns null when the username is not registered', async () => {
      prisma.userProfile.findUnique.mockResolvedValue(null);

      const result = await adapter.findByUsername('ghost');

      expect(result).toBeNull();
    });
  });
});
