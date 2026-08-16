import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../domain/user.repository';
import { UserResponseDto } from '../../dto/user.response.dto';
import { GetUserQuery } from './get-user.query';

/**
 * Read side of the get-user feature.
 *
 * Reads through the repository interface (mockable in tests) and returns the
 * projection DTO.
 */
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  public constructor(
    @Inject(USER_REPOSITORY) private readonly repository: UserRepository,
  ) {}

  public async execute(query: GetUserQuery): Promise<UserResponseDto> {
    const user = await this.repository.findById(query.userId);
    if (!user) {
      throw new NotFoundException(`User with id "${query.userId}" not found.`);
    }
    return UserResponseDto.fromDomain(user);
  }
}
