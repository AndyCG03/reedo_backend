import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { ListPostsQuery } from '../../../src/modules/posts/features/list-posts/list-posts.query';
import { ListPostsEndpoint } from '../../../src/modules/posts/features/list-posts/list-posts.endpoint';

describe('ListPostsEndpoint', () => {
  let endpoint: ListPostsEndpoint;
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListPostsEndpoint],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    endpoint = module.get<ListPostsEndpoint>(ListPostsEndpoint);
  });

  it('dispatches a ListPostsQuery and returns its result', async () => {
    const expected = { data: [], meta: { total: 0 } };
    queryBus.execute.mockResolvedValue(expected);

    const result = await endpoint.listPosts(
      { page: 1, pageSize: 20 },
      undefined,
      undefined,
    );

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ListPostsQuery));
    expect(result).toEqual(expected);
  });

  it('passes userId and bookId filters', async () => {
    queryBus.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

    await endpoint.listPosts({ page: 1, pageSize: 20 }, 'user-id', 'book-id');

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-id', bookId: 'book-id' }),
    );
  });
});
