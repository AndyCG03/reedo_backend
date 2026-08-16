import { NotFoundException } from '@nestjs/common';
import { UserProfile } from '../../../src/modules/user-profile/domain/user-profile';
import type { UserProfileRepository } from '../../../src/modules/user-profile/domain/user-profile.repository';
import { GetUserProfileQuery } from '../../../src/modules/user-profile/features/get-user-profile/get-user-profile.query';
import { GetUserProfileHandler } from '../../../src/modules/user-profile/features/get-user-profile/get-user-profile.handler';

describe('GetUserProfileHandler', () => {
  let handler: GetUserProfileHandler;
  let repository: jest.Mocked<UserProfileRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
    };
    handler = new GetUserProfileHandler(repository);
  });

  it('returns the profile projection when the profile exists', async () => {
    const profile = UserProfile.create({
      id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
      username: 'bookworm',
      displayName: 'Bookworm',
      bio: 'Avid reader.',
      avatarUrl: 'https://example.com/avatar.png',
    });
    repository.findById.mockResolvedValue(profile);

    const result = await handler.execute(new GetUserProfileQuery(profile.id));

    expect(repository.findById).toHaveBeenCalledWith(profile.id);
    expect(result).toMatchObject({
      id: profile.id,
      username: 'bookworm',
      displayName: 'Bookworm',
      bio: 'Avid reader.',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });

  it('throws NotFoundException when the profile does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetUserProfileQuery('missing-id')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
