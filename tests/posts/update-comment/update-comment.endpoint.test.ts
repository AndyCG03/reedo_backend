import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateCommentCommand } from '../../../src/modules/posts/features/update-comment/update-comment.command';
import { UpdateCommentEndpoint } from '../../../src/modules/posts/features/update-comment/update-comment.endpoint';

describe('UpdateCommentEndpoint', () => {
  let endpoint: UpdateCommentEndpoint;
  let commandBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpdateCommentEndpoint],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    endpoint = module.get<UpdateCommentEndpoint>(UpdateCommentEndpoint);
  });

  it('dispatches an UpdateCommentCommand', async () => {
    const expected = { id: 'comment-id', content: 'Updated' };
    commandBus.execute.mockResolvedValue(expected);

    const result = await endpoint.update({ userId: 'user-id' }, 'comment-id', {
      content: 'Updated',
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdateCommentCommand),
    );
    expect(result).toEqual(expected);
  });
});
