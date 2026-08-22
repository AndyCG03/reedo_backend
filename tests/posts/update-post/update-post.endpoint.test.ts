import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdatePostCommand } from '../../../src/modules/posts/features/update-post/update-post.command';
import { UpdatePostEndpoint } from '../../../src/modules/posts/features/update-post/update-post.endpoint';

describe('UpdatePostEndpoint', () => {
  let endpoint: UpdatePostEndpoint;
  let commandBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpdatePostEndpoint],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    endpoint = module.get<UpdatePostEndpoint>(UpdatePostEndpoint);
  });

  it('dispatches an UpdatePostCommand and returns its result', async () => {
    const dto = { content: 'Updated' };
    const expected = { id: 'post-id', content: 'Updated' };
    commandBus.execute.mockResolvedValue(expected);

    const result = await endpoint.update({ userId: 'user-id' }, 'post-id', dto);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdatePostCommand),
    );
    expect(result).toEqual(expected);
  });
});
