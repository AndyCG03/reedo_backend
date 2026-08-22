import { Module } from '@nestjs/common';
import { UsersModule } from '../modules/users/users.module';
import { BooksModule } from '../modules/books/books.module';
import { UserBooksModule } from '../modules/user-books/user-books.module';
import { SyncModule } from '../modules/sync/sync.module';
import { PostsModule } from '../modules/posts/posts.module';
import { AuthModule } from '../modules/auth/auth.module';
import { HealthEndpoint } from './health.endpoint';

/**
 * General endpoint mapper.
 *
 * Single place where every feature module is joined to the HTTP layer.
 * When you add a new feature module, register it here.
 */
@Module({
  imports: [AuthModule, UsersModule, BooksModule, UserBooksModule, SyncModule, PostsModule],
  controllers: [HealthEndpoint],
})
export class RoutesModule {}
