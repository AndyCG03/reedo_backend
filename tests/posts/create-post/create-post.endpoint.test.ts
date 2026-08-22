import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { CreatePostCommand } from '../../../src/modules/posts/features/create-post/create-post.command';
import { CreatePostEndpoint } from '../../../src/modules/posts/features/create-post/create-post.endpoint';

describe('CreatePostEndpoint', () => {
  let endpoint: CreatePostEndpoint;
  let commandBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreatePostEndpoint],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    endpoint = module.get<CreatePostEndpoint>(CreatePostEndpoint);
  });

  it('dispatches a CreatePostCommand and returns its result', async () => {
    const dto = { content: 'Me encantó', bookId: undefined };
    const expected = { id: 'post-id', content: 'Me encantó' };
    commandBus.execute.mockResolvedValue(expected);

    const result = await endpoint.create({ userId: 'user-id' }, dto);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreatePostCommand),
    );
    expect(result).toEqual(expected);
  });

  it('uses hardcoded fallback when no userId in request', async () => {
    commandBus.execute.mockResolvedValue({ id: 'post-id' });

    await endpoint.create({}, { content: 'test' });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '00000000-0000-0000-0000-000000000001',
      }),
    );
  });
});
