import type { PaginatedResult } from '../../../../common/sieve/sieve-options';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  USER_BOOK_REPOSITORY,
  type UserBookRepository,
} from '../../domain/user-book.repository';
import { UserBookResponseDto } from '../../dto/user-book.response.dto';
import { ListUserBooksQuery } from './list-user-books.query';

@QueryHandler(ListUserBooksQuery)
export class ListUserBooksHandler implements IQueryHandler<ListUserBooksQuery> {
  public constructor(
    @Inject(USER_BOOK_REPOSITORY)
    private readonly repository: UserBookRepository,
  ) {}

  public async execute(
    query: ListUserBooksQuery,
  ): Promise<PaginatedResult<UserBookResponseDto>> {
    const page = await this.repository.findByUserId(query.userId, query.query);
    return {
      ...page,
      data: page.data.map((userBook) =>
        UserBookResponseDto.fromDomain(userBook),
      ),
    };
  }
}
