import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { ListCommentsQuery } from '../../../src/modules/posts/features/list-comments/list-comments.query';
import { ListCommentsEndpoint } from '../../../src/modules/posts/features/list-comments/list-comments.endpoint';

describe('ListCommentsEndpoint', () => {
  let endpoint: ListCommentsEndpoint;
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListCommentsEndpoint],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    endpoint = module.get<ListCommentsEndpoint>(ListCommentsEndpoint);
  });

  it('dispatches a ListCommentsQuery', async () => {
    const expected = { data: [], meta: { total: 0 } };
    queryBus.execute.mockResolvedValue(expected);

    const result = await endpoint.listComments('post-id', {
      page: 1,
      pageSize: 20,
    });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(ListCommentsQuery),
    );
    expect(result).toEqual(expected);
  });
});
