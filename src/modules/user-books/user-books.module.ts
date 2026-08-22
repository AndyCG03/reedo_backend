import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { USER_BOOK_REPOSITORY } from './domain/user-book.repository';
import { GetUserBookEndpoint } from './features/get-user-book/get-user-book.endpoint';
import { GetUserBookHandler } from './features/get-user-book/get-user-book.handler';
import { ListUserBooksEndpoint } from './features/list-user-books/list-user-books.endpoint';
import { ListUserBooksHandler } from './features/list-user-books/list-user-books.handler';
import { PrismaUserBookRepository } from './infrastructure/persistence/prisma/prisma-user-book.repository';

@Module({
  imports: [CqrsModule],
  controllers: [GetUserBookEndpoint, ListUserBooksEndpoint],
  providers: [
    {
      provide: USER_BOOK_REPOSITORY,
      useClass: PrismaUserBookRepository,
    },
    GetUserBookHandler,
    ListUserBooksHandler,
  ],
})
export class UserBooksModule {}
