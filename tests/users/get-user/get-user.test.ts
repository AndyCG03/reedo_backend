import { NotFoundException } from '@nestjs/common';
import { User } from '../../../src/modules/users/domain/user';
import type { UserRepository } from '../../../src/modules/users/domain/user.repository';
import { GetUserQuery } from '../../../src/modules/users/features/get-user/get-user.query';
import { GetUserHandler } from '../../../src/modules/users/features/get-user/get-user.handler';

describe('GetUserHandler', () => {
  let handler: GetUserHandler;
  let repository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findMany: jest.fn(),
    };
    handler = new GetUserHandler(repository);
  });

  it('returns the user projection when the user exists', async () => {
    const user = User.create({
      id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
      username: 'bookworm',
      email: 'bookworm@example.com',
      bio: 'Avid reader.',
      avatarUrl: 'https://example.com/avatar.png',
    });
    repository.findById.mockResolvedValue(user);

    const result = await handler.execute(new GetUserQuery(user.id));

    expect(repository.findById).toHaveBeenCalledWith(user.id);
    expect(result).toMatchObject({
      id: user.id,
      username: 'bookworm',
      email: 'bookworm@example.com',
      bio: 'Avid reader.',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });

  it('throws NotFoundException when the user does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetUserQuery('missing-id')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
