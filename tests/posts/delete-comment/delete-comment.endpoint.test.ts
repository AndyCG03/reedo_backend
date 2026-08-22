import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteCommentCommand } from '../../../src/modules/posts/features/delete-comment/delete-comment.command';
import { DeleteCommentEndpoint } from '../../../src/modules/posts/features/delete-comment/delete-comment.endpoint';

describe('DeleteCommentEndpoint', () => {
  let endpoint: DeleteCommentEndpoint;
  let commandBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeleteCommentEndpoint],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    endpoint = module.get<DeleteCommentEndpoint>(DeleteCommentEndpoint);
  });

  it('dispatches a DeleteCommentCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await endpoint.delete({ userId: 'user-id' }, 'comment-id');

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteCommentCommand),
    );
  });
});
