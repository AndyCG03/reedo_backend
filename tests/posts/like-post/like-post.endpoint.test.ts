import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { LikePostCommand } from '../../../src/modules/posts/features/like-post/like-post.command';
import { LikePostEndpoint } from '../../../src/modules/posts/features/like-post/like-post.endpoint';

describe('LikePostEndpoint', () => {
  let endpoint: LikePostEndpoint;
  let commandBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LikePostEndpoint],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    endpoint = module.get<LikePostEndpoint>(LikePostEndpoint);
  });

  it('dispatches a LikePostCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await endpoint.like({ userId: 'user-id' }, 'post-id');

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(LikePostCommand),
    );
  });
});
