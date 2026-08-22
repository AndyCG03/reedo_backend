import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { UnlikePostCommand } from '../../../src/modules/posts/features/unlike-post/unlike-post.command';
import { UnlikePostEndpoint } from '../../../src/modules/posts/features/unlike-post/unlike-post.endpoint';

describe('UnlikePostEndpoint', () => {
  let endpoint: UnlikePostEndpoint;
  let commandBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnlikePostEndpoint],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    endpoint = module.get<UnlikePostEndpoint>(UnlikePostEndpoint);
  });

  it('dispatches an UnlikePostCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await endpoint.unlike({ userId: 'user-id' }, 'post-id');

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UnlikePostCommand),
    );
  });
});
