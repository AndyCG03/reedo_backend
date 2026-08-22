import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BOOK_REPOSITORY } from './domain/book.repository';
import { CreateBookEndpoint } from './features/create-book/create-book.endpoint';
import { CreateBookHandler } from './features/create-book/create-book.handler';
import { GetBookEndpoint } from './features/get-book/get-book.endpoint';
import { GetBookHandler } from './features/get-book/get-book.handler';
import { ListBooksEndpoint } from './features/list-books/list-books.endpoint';
import { ListBooksHandler } from './features/list-books/list-books.handler';
import { PrismaBookRepository } from './infrastructure/persistence/prisma/prisma-book.repository';

@Module({
  imports: [CqrsModule],
  controllers: [CreateBookEndpoint, GetBookEndpoint, ListBooksEndpoint],
  providers: [
    {
      provide: BOOK_REPOSITORY,
      useClass: PrismaBookRepository,
    },
    CreateBookHandler,
    GetBookHandler,
    ListBooksHandler,
  ],
})
export class BooksModule {}
