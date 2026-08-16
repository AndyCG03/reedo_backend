import { ConflictException } from '@nestjs/common';
import { CreateUserCommand } from '../../../src/modules/users/features/create-user/create-user.command';
import { CreateUserHandler } from '../../../src/modules/users/features/create-user/create-user.handler';
import type { UserRepository } from '../../../src/modules/users/domain/user.repository';

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let repository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findMany: jest.fn(),
    };
    handler = new CreateUserHandler(repository);
  });

  it('creates and persists a user when the username is available', async () => {
    repository.findByUsername.mockResolvedValue(null);
    repository.create.mockImplementation((user) => user);

    const result = await handler.execute(
      new CreateUserCommand(
        'bookworm',
        'bookworm@example.com',
        'I love books',
        null,
      ),
    );

    expect(repository.findByUsername).toHaveBeenCalledWith('bookworm');
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'bookworm',
        email: 'bookworm@example.com',
        bio: 'I love books',
        avatarUrl: null,
      }),
    );
    expect(result).toMatchObject({
      username: 'bookworm',
      email: 'bookworm@example.com',
      bio: 'I love books',
      avatarUrl: null,
    });
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('defaults optional fields to null', async () => {
    repository.findByUsername.mockResolvedValue(null);
    repository.create.mockImplementation((user) => user);

    const result = await handler.execute(new CreateUserCommand('reader'));

    expect(result.email).toBeNull();
    expect(result.bio).toBeNull();
    expect(result.avatarUrl).toBeNull();
  });

  it('throws ConflictException when the username is already taken', async () => {
    repository.findByUsername.mockResolvedValue({ id: 'existing-id' } as never);

    await expect(
      handler.execute(new CreateUserCommand('bookworm')),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
  });
});
