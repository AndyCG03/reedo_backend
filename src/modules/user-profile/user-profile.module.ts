import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { USER_PROFILE_REPOSITORY } from './domain/user-profile.repository';
import { CreateUserProfileEndpoint } from './features/create-user-profile/create-user-profile.endpoint';
import { CreateUserProfileHandler } from './features/create-user-profile/create-user-profile.handler';
import { GetUserProfileEndpoint } from './features/get-user-profile/get-user-profile.endpoint';
import { GetUserProfileHandler } from './features/get-user-profile/get-user-profile.handler';
import { PrismaUserProfileRepository } from './infrastructure/persistence/prisma/prisma-user-profile.repository';

/**
 * User profile vertical slice.
 *
 * Every feature (create, get...) lives in its own folder under features/,
 * each with its endpoint, handler, command/query and dto. The features share
 * the domain model, the repository port interface and the persistence
 * adapter, which are registered below.
 *
 * Storage uses Prisma (PostgreSQL). PrismaService is provided globally by
 * PrismaModule, so the adapter just injects it.
 */
@Module({
  imports: [CqrsModule],
  controllers: [CreateUserProfileEndpoint, GetUserProfileEndpoint],
  providers: [
    {
      provide: USER_PROFILE_REPOSITORY,
      useClass: PrismaUserProfileRepository,
    },
    CreateUserProfileHandler,
    GetUserProfileHandler,
  ],
})
export class UserProfileModule {}
