import { ConflictException } from '@nestjs/common';
import { CreateUserProfileCommand } from '../../../src/modules/user-profile/features/create-user-profile/create-user-profile.command';
import { CreateUserProfileHandler } from '../../../src/modules/user-profile/features/create-user-profile/create-user-profile.handler';
import type { UserProfileRepository } from '../../../src/modules/user-profile/domain/user-profile.repository';

describe('CreateUserProfileHandler', () => {
  let handler: CreateUserProfileHandler;
  let repository: jest.Mocked<UserProfileRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
    };
    handler = new CreateUserProfileHandler(repository);
  });

  it('creates and persists a profile when the username is available', async () => {
    repository.findByUsername.mockResolvedValue(null);
    repository.create.mockImplementation((profile) => profile);

    const result = await handler.execute(
      new CreateUserProfileCommand(
        'bookworm',
        'Bookworm',
        'I love books',
        null,
      ),
    );

    expect(repository.findByUsername).toHaveBeenCalledWith('bookworm');
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'bookworm',
        displayName: 'Bookworm',
        bio: 'I love books',
        avatarUrl: null,
      }),
    );
    expect(result).toMatchObject({
      username: 'bookworm',
      displayName: 'Bookworm',
      bio: 'I love books',
      avatarUrl: null,
    });
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('defaults optional fields to null', async () => {
    repository.findByUsername.mockResolvedValue(null);
    repository.create.mockImplementation((profile) => profile);

    const result = await handler.execute(
      new CreateUserProfileCommand('reader', 'Reader'),
    );

    expect(result.bio).toBeNull();
    expect(result.avatarUrl).toBeNull();
  });

  it('throws ConflictException when the username is already taken', async () => {
    repository.findByUsername.mockResolvedValue({ id: 'existing-id' } as never);

    await expect(
      handler.execute(new CreateUserProfileCommand('bookworm', 'Bookworm')),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
  });
});
