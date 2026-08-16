import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { USER_REPOSITORY } from './domain/user.repository';
import { CreateUserEndpoint } from './features/create-user/create-user.endpoint';
import { CreateUserHandler } from './features/create-user/create-user.handler';
import { GetUserEndpoint } from './features/get-user/get-user.endpoint';
import { GetUserHandler } from './features/get-user/get-user.handler';
import { ListUsersEndpoint } from './features/list-users/list-users.endpoint';
import { ListUsersHandler } from './features/list-users/list-users.handler';
import { PrismaUserRepository } from './infrastructure/persistence/prisma/prisma-user.repository';

/**
 * Users vertical slice.
 *
 * Every feature (create, get, list...) lives in its own folder under
 * features/, each with its endpoint, handler, command/query and dto. The
 * features share the domain model, the repository port interface and the
 * persistence adapter, which are registered below.
 *
 * Storage uses Prisma (PostgreSQL). PrismaService is provided globally by
 * PrismaModule, so the adapter just injects it.
 */
@Module({
  imports: [CqrsModule],
  controllers: [CreateUserEndpoint, GetUserEndpoint, ListUsersEndpoint],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    CreateUserHandler,
    GetUserHandler,
    ListUsersHandler,
  ],
})
export class UsersModule {}
