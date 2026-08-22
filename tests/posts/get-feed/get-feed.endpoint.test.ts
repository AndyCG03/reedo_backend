import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { GetFeedQuery } from '../../../src/modules/posts/features/get-feed/get-feed.query';
import { GetFeedEndpoint } from '../../../src/modules/posts/features/get-feed/get-feed.endpoint';

describe('GetFeedEndpoint', () => {
  let endpoint: GetFeedEndpoint;
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetFeedEndpoint],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    endpoint = module.get<GetFeedEndpoint>(GetFeedEndpoint);
  });

  it('dispatches a GetFeedQuery', async () => {
    const expected = { data: [], meta: { total: 0 } };
    queryBus.execute.mockResolvedValue(expected);

    const result = await endpoint.getFeed(
      { userId: 'user-id' },
      { page: 1, pageSize: 20 },
    );

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetFeedQuery));
    expect(result).toEqual(expected);
  });
});
