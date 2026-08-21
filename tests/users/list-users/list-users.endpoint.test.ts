import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { ListUsersQuery } from '../../../src/modules/users/features/list-users/list-users.query';
import { ListUsersEndpoint } from '../../../src/modules/users/features/list-users/list-users.endpoint';
import type { SieveOptions } from '../../../src/common/sieve';

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

  it('dispatches a ListUsersQuery with the parsed sieve options', async () => {
    const query: SieveOptions = { page: 2, pageSize: 10 };
    const expected = { data: [], meta: {} };
    queryBus.execute.mockResolvedValue(expected);

    const result = await endpoint.listUsers(query);

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ListUsersQuery));
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { page: 2, pageSize: 10 },
      }),
    );
    expect(result).toEqual(expected);
  });
});
