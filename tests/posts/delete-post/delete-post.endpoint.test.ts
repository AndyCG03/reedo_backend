import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { DeletePostCommand } from '../../../src/modules/posts/features/delete-post/delete-post.command';
import { DeletePostEndpoint } from '../../../src/modules/posts/features/delete-post/delete-post.endpoint';

describe('DeletePostEndpoint', () => {
  let endpoint: DeletePostEndpoint;
  let commandBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeletePostEndpoint],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    endpoint = module.get<DeletePostEndpoint>(DeletePostEndpoint);
  });

  it('dispatches a DeletePostCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await endpoint.delete({ userId: 'user-id' }, 'post-id');

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeletePostCommand),
    );
  });
});
