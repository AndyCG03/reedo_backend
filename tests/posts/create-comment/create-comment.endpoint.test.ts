import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateCommentCommand } from '../../../src/modules/posts/features/create-comment/create-comment.command';
import { CreateCommentEndpoint } from '../../../src/modules/posts/features/create-comment/create-comment.endpoint';

describe('CreateCommentEndpoint', () => {
  let endpoint: CreateCommentEndpoint;
  let commandBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateCommentEndpoint],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    endpoint = module.get<CreateCommentEndpoint>(CreateCommentEndpoint);
  });

  it('dispatches a CreateCommentCommand', async () => {
    const expected = { id: 'comment-id', content: 'Great' };
    commandBus.execute.mockResolvedValue(expected);

    const result = await endpoint.create({ userId: 'user-id' }, 'post-id', {
      content: 'Great',
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateCommentCommand),
    );
    expect(result).toEqual(expected);
  });
});
