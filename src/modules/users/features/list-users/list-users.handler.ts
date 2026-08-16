import type { CursorPaginated, Paginated } from '@nestarc/pagination';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../domain/user.repository';
import { UserResponseDto } from '../../dto/user.response.dto';
import { ListUsersQuery } from './list-users.query';

/**
 * Read side of the list-users feature.
 *
 * Reads through the repository interface (mockable in tests) and returns the
 * same paginated envelope, mapping each entity to its projection DTO.
 */
@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  public constructor(
    @Inject(USER_REPOSITORY) private readonly repository: UserRepository,
  ) {}

  public async execute(
    query: ListUsersQuery,
  ): Promise<Paginated<UserResponseDto> | CursorPaginated<UserResponseDto>> {
    const page = await this.repository.findMany(query.query);
    return {
      ...page,
      data: page.data.map((user) => UserResponseDto.fromDomain(user)),
    };
  }
}
