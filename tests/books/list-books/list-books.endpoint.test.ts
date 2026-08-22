import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { ListBooksEndpoint } from '../../../src/modules/books/features/list-books/list-books.endpoint';
import { ListBooksQuery } from '../../../src/modules/books/features/list-books/list-books.query';

describe('ListBooksEndpoint', () => {
  let endpoint: ListBooksEndpoint;
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListBooksEndpoint],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    endpoint = module.get<ListBooksEndpoint>(ListBooksEndpoint);
  });

  it('dispatches a ListBooksQuery with the SieveOptions', async () => {
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

    const result = await endpoint.listBooks(sieveOptions as any);

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ListBooksQuery));
    expect(result).toEqual(expectedResponse);
  });
});
