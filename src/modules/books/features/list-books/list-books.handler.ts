import type { PaginatedResult } from '../../../../common/sieve/sieve-options';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  BOOK_REPOSITORY,
  type BookRepository,
} from '../../domain/book.repository';
import { BookResponseDto } from '../../dto/book.response.dto';
import { ListBooksQuery } from './list-books.query';

@QueryHandler(ListBooksQuery)
export class ListBooksHandler implements IQueryHandler<ListBooksQuery> {
  public constructor(
    @Inject(BOOK_REPOSITORY) private readonly repository: BookRepository,
  ) {}

  public async execute(
    query: ListBooksQuery,
  ): Promise<PaginatedResult<BookResponseDto>> {
    const page = await this.repository.findMany(query.query);
    return {
      ...page,
      data: page.data.map((book) => BookResponseDto.fromDomain(book)),
    };
  }
}
