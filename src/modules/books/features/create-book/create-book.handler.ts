import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { Book } from '../../domain/book';
import {
  BOOK_REPOSITORY,
  type BookRepository,
} from '../../domain/book.repository';
import { BookResponseDto } from '../../dto/book.response.dto';
import { CreateBookCommand } from './create-book.command';

@CommandHandler(CreateBookCommand)
export class CreateBookHandler implements ICommandHandler<CreateBookCommand> {
  public constructor(
    @Inject(BOOK_REPOSITORY) private readonly repository: BookRepository,
  ) {}

  public async execute(command: CreateBookCommand): Promise<BookResponseDto> {
    const book = Book.create({
      id: randomUUID(),
      title: command.title,
      totalPages: command.totalPages,
    });

    const created = await this.repository.create(book);
    return BookResponseDto.fromDomain(created);
  }
}
