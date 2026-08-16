import { User } from '../../../src/modules/users/domain/user';
import type { UserRepository } from '../../../src/modules/users/domain/user.repository';
import { ListUsersQuery } from '../../../src/modules/users/features/list-users/list-users.query';
import { ListUsersHandler } from '../../../src/modules/users/features/list-users/list-users.handler';
import { UserResponseDto } from '../../../src/modules/users/dto/user.response.dto';
import type { Paginated } from '@nestarc/pagination';

describe('ListUsersHandler', () => {
  let handler: ListUsersHandler;
  let repository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findMany: jest.fn(),
    };
    handler = new ListUsersHandler(repository);
  });

  it('returns a paginated envelope of user DTOs', async () => {
    const user = User.create({
      id: '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a',
      username: 'bookworm',
      email: 'bookworm@example.com',
      bio: null,
      avatarUrl: null,
    });
    const paginated: Paginated<User> = {
      data: [user],
      meta: {
        itemsPerPage: 20,
        currentPage: 1,
        totalItems: 1,
        totalPages: 1,
        sortBy: [['createdAt', 'DESC']],
      },
      links: {
        first: '/users?page=1&limit=20',
        previous: null,
        current: '/users',
        next: null,
        last: '/users?page=1&limit=20',
      },
    };
    repository.findMany.mockResolvedValue(paginated);

    const result = await handler.execute(
      new ListUsersQuery({ path: '/users' }),
    );

    expect(repository.findMany).toHaveBeenCalledWith({ path: '/users' });
    expect(result.data[0]).toBeInstanceOf(UserResponseDto);
    expect(result.data[0]).toMatchObject({
      id: user.id,
      username: 'bookworm',
      email: 'bookworm@example.com',
    });
    expect(result.meta.totalItems).toBe(1);
    expect(result.links.current).toBe('/users');
  });
});
