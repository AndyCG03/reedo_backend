import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  USER_PROFILE_REPOSITORY,
  type UserProfileRepository,
} from '../../domain/user-profile.repository';
import { UserProfileResponseDto } from '../../dto/user-profile.response.dto';
import { GetUserProfileQuery } from './get-user-profile.query';

/**
 * Read side of the get-user-profile feature.
 *
 * Reads through the repository interface (mockable in tests) and returns the
 * projection DTO.
 */
@QueryHandler(GetUserProfileQuery)
export class GetUserProfileHandler implements IQueryHandler<GetUserProfileQuery> {
  public constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly repository: UserProfileRepository,
  ) {}

  public async execute(
    query: GetUserProfileQuery,
  ): Promise<UserProfileResponseDto> {
    const profile = await this.repository.findById(query.profileId);
    if (!profile) {
      throw new NotFoundException(
        `User profile with id "${query.profileId}" not found.`,
      );
    }
    return UserProfileResponseDto.fromDomain(profile);
  }
}
