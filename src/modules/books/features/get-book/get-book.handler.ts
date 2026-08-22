import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  BOOK_REPOSITORY,
  type BookRepository,
} from '../../domain/book.repository';
import { BookResponseDto } from '../../dto/book.response.dto';
import { GetBookQuery } from './get-book.query';

@QueryHandler(GetBookQuery)
export class GetBookHandler implements IQueryHandler<GetBookQuery> {
  public constructor(
    @Inject(BOOK_REPOSITORY) private readonly repository: BookRepository,
  ) {}

  public async execute(query: GetBookQuery): Promise<BookResponseDto> {
    const book = await this.repository.findById(query.bookId);
    if (!book) {
      throw new NotFoundException(`Book with id "${query.bookId}" not found.`);
    }
    return BookResponseDto.fromDomain(book);
  }
}
