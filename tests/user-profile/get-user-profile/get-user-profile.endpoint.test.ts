import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { UserProfileResponseDto } from '../../../src/modules/user-profile/dto/user-profile.response.dto';
import { GetUserProfileQuery } from '../../../src/modules/user-profile/features/get-user-profile/get-user-profile.query';
import { GetUserProfileEndpoint } from '../../../src/modules/user-profile/features/get-user-profile/get-user-profile.endpoint';

describe('GetUserProfileEndpoint', () => {
  let endpoint: GetUserProfileEndpoint;
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetUserProfileEndpoint],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    endpoint = module.get<GetUserProfileEndpoint>(GetUserProfileEndpoint);
  });

  it('dispatches a GetUserProfileQuery and returns its result', async () => {
    const profileId = '68f6c1d1-9d58-4e1c-9d61-0d6c0f0f2f3a';
    const expected = {
      id: profileId,
      username: 'bookworm',
    } as UserProfileResponseDto;
    queryBus.execute.mockResolvedValue(expected);

    const result = await endpoint.getProfile(profileId);

    expect(queryBus.execute).toHaveBeenCalledWith(
      new GetUserProfileQuery(profileId),
    );
    expect(result).toEqual(expected);
  });
});
