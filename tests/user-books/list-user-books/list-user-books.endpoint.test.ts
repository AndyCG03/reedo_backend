import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { ListUserBooksEndpoint } from '../../../src/modules/user-books/features/list-user-books/list-user-books.endpoint';
import { ListUserBooksQuery } from '../../../src/modules/user-books/features/list-user-books/list-user-books.query';

describe('ListUserBooksEndpoint', () => {
  let endpoint: ListUserBooksEndpoint;
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListUserBooksEndpoint],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    endpoint = module.get<ListUserBooksEndpoint>(ListUserBooksEndpoint);
  });

  it('dispatches a ListUserBooksQuery with the userId and SieveOptions', async () => {
    const sieveOptions = {
      page: 1,
      pageSize: 20,
      filters: '',
      sorts: '',
    };

    const expectedResponse = {
      data: [],
      meta: {
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
        lastPage: 0,
      },
    };

    queryBus.execute.mockResolvedValue(expectedResponse);

    const result = await endpoint.listUserBooks('user-id', sieveOptions as any);

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(ListUserBooksQuery),
    );
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-id' }),
    );
    expect(result).toEqual(expectedResponse);
  });
});
