import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { UserResponseDto } from '../../../src/modules/users/dto/user.response.dto';
import { GetUserQuery } from '../../../src/modules/users/features/get-user/get-user.query';
import { GetUserEndpoint } from '../../../src/modules/users/features/get-user/get-user.endpoint';

describe('GetUserEndpoint', () => {
  let endpoint: GetUserEndpoint;
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetUserEndpoint],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    endpoint = module.get<GetUserEndpoint>(GetUserEndpoint);
  });

  it('dispatches a GetUserQuery and returns its result', async () => {
    const userId = '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a';
    const expected = {
      id: userId,
      username: 'bookworm',
    } as UserResponseDto;
    queryBus.execute.mockResolvedValue(expected);

    const result = await endpoint.getUser(userId);

    expect(queryBus.execute).toHaveBeenCalledWith(new GetUserQuery(userId));
    expect(result).toEqual(expected);
  });
});
