import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { GetPostQuery } from '../../../src/modules/posts/features/get-post/get-post.query';
import { GetPostEndpoint } from '../../../src/modules/posts/features/get-post/get-post.endpoint';

describe('GetPostEndpoint', () => {
  let endpoint: GetPostEndpoint;
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetPostEndpoint],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    endpoint = module.get<GetPostEndpoint>(GetPostEndpoint);
  });

  it('dispatches a GetPostQuery and returns its result', async () => {
    const expected = { id: 'post-id', content: 'Hello' };
    queryBus.execute.mockResolvedValue(expected);

    const result = await endpoint.getPost({ userId: 'user-id' }, 'post-id');

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetPostQuery));
    expect(result).toEqual(expected);
  });
});
