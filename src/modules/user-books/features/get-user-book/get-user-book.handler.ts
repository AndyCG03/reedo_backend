import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  USER_BOOK_REPOSITORY,
  type UserBookRepository,
} from '../../domain/user-book.repository';
import { UserBookResponseDto } from '../../dto/user-book.response.dto';
import { GetUserBookQuery } from './get-user-book.query';

@QueryHandler(GetUserBookQuery)
export class GetUserBookHandler implements IQueryHandler<GetUserBookQuery> {
  public constructor(
    @Inject(USER_BOOK_REPOSITORY)
    private readonly repository: UserBookRepository,
  ) {}

  public async execute(query: GetUserBookQuery): Promise<UserBookResponseDto> {
    const userBook = await this.repository.findByUserAndBook(
      query.userId,
      query.bookId,
    );
    if (!userBook) {
      throw new NotFoundException(
        `UserBook not found for user "${query.userId}" and book "${query.bookId}".`,
      );
    }
    return UserBookResponseDto.fromDomain(userBook);
  }
}
