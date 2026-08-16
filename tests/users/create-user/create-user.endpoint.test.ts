import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserCommand } from '../../../src/modules/users/features/create-user/create-user.command';
import { CreateUserEndpoint } from '../../../src/modules/users/features/create-user/create-user.endpoint';

describe('CreateUserEndpoint', () => {
  let endpoint: CreateUserEndpoint;
  let commandBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateUserEndpoint],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    endpoint = module.get<CreateUserEndpoint>(CreateUserEndpoint);
  });

  it('dispatches a CreateUserCommand and returns its result', async () => {
    const dto = {
      username: 'bookworm',
      email: 'bookworm@example.com',
      bio: 'I love books',
      avatarUrl: 'https://example.com/avatar.png',
    };
    const expected = { id: 'user-id', ...dto };
    commandBus.execute.mockResolvedValue(expected);

    const result = await endpoint.create(dto);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateUserCommand),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'bookworm',
        email: 'bookworm@example.com',
        bio: 'I love books',
        avatarUrl: 'https://example.com/avatar.png',
      }),
    );
    expect(result).toEqual(expected);
  });
});
