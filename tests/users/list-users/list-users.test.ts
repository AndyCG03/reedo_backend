import { User } from '../../../src/modules/users/domain/user';
import type { UserRepository } from '../../../src/modules/users/domain/user.repository';
import { ListUsersQuery } from '../../../src/modules/users/features/list-users/list-users.query';
import { ListUsersHandler } from '../../../src/modules/users/features/list-users/list-users.handler';
import { UserResponseDto } from '../../../src/modules/users/dto/user.response.dto';
import type { PaginatedResult } from '../../../src/common/sieve';

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
    const paginated: PaginatedResult<User> = {
      data: [user],
      meta: {
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        lastPage: 1,
      },
    };
    repository.findMany.mockResolvedValue(paginated);

    const result = await handler.execute(
      new ListUsersQuery({ page: 1, pageSize: 20 }),
    );

    expect(repository.findMany).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(result.data[0]).toBeInstanceOf(UserResponseDto);
    expect(result.data[0]).toMatchObject({
      id: user.id,
      username: 'bookworm',
      email: 'bookworm@example.com',
    });
    expect(result.meta.total).toBe(1);
  });
});
