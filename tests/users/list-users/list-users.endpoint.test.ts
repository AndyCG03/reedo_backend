import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import type { PaginateQuery } from '@nestarc/pagination';
import { ListUsersQuery } from '../../../src/modules/users/features/list-users/list-users.query';
import { ListUsersEndpoint } from '../../../src/modules/users/features/list-users/list-users.endpoint';

describe('ListUsersEndpoint', () => {
  let endpoint: ListUsersEndpoint;
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListUsersEndpoint],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    endpoint = module.get<ListUsersEndpoint>(ListUsersEndpoint);
  });

  it('dispatches a ListUsersQuery with the parsed pagination query', async () => {
    const query = {
      path: '/users',
      page: 2,
      limit: 10,
    } as unknown as PaginateQuery;
    const expected = { data: [], meta: {}, links: {} };
    queryBus.execute.mockResolvedValue(expected);

    const result = await endpoint.listUsers(query);

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ListUsersQuery));
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { path: '/users', page: 2, limit: 10 },
      }),
    );
    expect(result).toEqual(expected);
  });
});
