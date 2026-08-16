import { Repository } from 'typeorm';
import { UserProfile } from '../../../src/modules/user-profile/domain/user-profile';
import { UserProfileEntity } from '../../../src/modules/user-profile/infrastructure/persistence/typeorm/user-profile.entity';
import { TypeOrmUserProfileRepository } from '../../../src/modules/user-profile/infrastructure/persistence/typeorm/typeorm-user-profile.repository';

describe('TypeOrmUserProfileRepository', () => {
  let repository: jest.Mocked<Repository<UserProfileEntity>>;
  let adapter: TypeOrmUserProfileRepository;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<UserProfileEntity>>;
    adapter = new TypeOrmUserProfileRepository(repository);
  });

  describe('create', () => {
    it('persists the entity mapped from the domain model', async () => {
      const profile = UserProfile.create({
        id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
        username: 'bookworm',
        displayName: 'Bookworm',
        bio: null,
        avatarUrl: null,
      });

      repository.save.mockResolvedValue(UserProfileEntity.fromDomain(profile));

      const result = await adapter.create(profile);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: profile.id,
          username: 'bookworm',
          displayName: 'Bookworm',
          bio: null,
          avatarUrl: null,
        }),
      );
      expect(result).toEqual(profile);
    });
  });

  describe('findById', () => {
    it('maps the persisted record back to the domain model', async () => {
      const profile = UserProfile.create({
        id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
        username: 'bookworm',
        displayName: 'Bookworm',
        bio: 'I love books',
      });
      repository.findOne.mockResolvedValue(
        UserProfileEntity.fromDomain(profile),
      );

      const result = await adapter.findById(profile.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: profile.id },
      });
      expect(result).toEqual(profile);
    });

    it('returns null when the profile does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await adapter.findById('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('maps the persisted record back to the domain model', async () => {
      const profile = UserProfile.create({
        id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
        username: 'bookworm',
        displayName: 'Bookworm',
      });
      repository.findOne.mockResolvedValue(
        UserProfileEntity.fromDomain(profile),
      );

      const result = await adapter.findByUsername('bookworm');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: 'bookworm' },
      });
      expect(result).toEqual(profile);
    });

    it('returns null when the username is not registered', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await adapter.findByUsername('ghost');

      expect(result).toBeNull();
    });
  });
});
