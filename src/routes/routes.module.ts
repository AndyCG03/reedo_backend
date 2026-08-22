import { Module } from '@nestjs/common';
import { UsersModule } from '../modules/users/users.module';
import { BooksModule } from '../modules/books/books.module';
import { UserBooksModule } from '../modules/user-books/user-books.module';
import { SyncModule } from '../modules/sync/sync.module';
import { HealthEndpoint } from './health.endpoint';

/**
 * General endpoint mapper.
 *
 * This is the single place where the endpoints of every feature/module are
 * joined and exposed to the HTTP layer. When you add a new feature module,
 * register it here (and add its module to the imports array).
 */
@Module({
  imports: [UsersModule, BooksModule, UserBooksModule, SyncModule],
  controllers: [HealthEndpoint],
})
export class RoutesModule {}
