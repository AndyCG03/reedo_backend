import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_PROFILE_REPOSITORY } from './domain/user-profile.repository';
import { CreateUserProfileEndpoint } from './features/create-user-profile/create-user-profile.endpoint';
import { CreateUserProfileHandler } from './features/create-user-profile/create-user-profile.handler';
import { GetUserProfileEndpoint } from './features/get-user-profile/get-user-profile.endpoint';
import { GetUserProfileHandler } from './features/get-user-profile/get-user-profile.handler';
import { TypeOrmUserProfileRepository } from './infrastructure/persistence/typeorm/typeorm-user-profile.repository';
import { UserProfileEntity } from './infrastructure/persistence/typeorm/user-profile.entity';

/**
 * User profile vertical slice.
 *
 * Every feature (create, get...) lives in its own folder under features/,
 * each with its endpoint, handler, command/query and dto. The features share
 * the domain model, the repository port interface and the persistence
 * adapter, which are registered below.
 *
 * Storage adapters can be swapped per DATABASE_PROVIDER later:
 *   - 'postgres': TypeORM + PostgreSQL (default)
 *   - 'supabase': PostgreSQL via Supabase (future, same adapter)
 *   - 'firebase': Firestore / Firebase Auth (future, new adapter)
 */
@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([UserProfileEntity])],
  controllers: [CreateUserProfileEndpoint, GetUserProfileEndpoint],
  providers: [
    TypeOrmUserProfileRepository,
    {
      provide: USER_PROFILE_REPOSITORY,
      useFactory: (
        config: ConfigService,
        postgres: TypeOrmUserProfileRepository,
      ) => {
        const provider = config.get<string>('database.provider') ?? 'postgres';
        switch (provider) {
          case 'postgres':
            return postgres;
          // case 'supabase':
          //   return new SupabaseUserProfileRepository(...);
          // case 'firebase':
          //   return new FirebaseUserProfileRepository(...);
          default:
            throw new Error(
              `Unsupported DATABASE_PROVIDER "${provider}". Supported values: "postgres".`,
            );
        }
      },
      inject: [ConfigService, TypeOrmUserProfileRepository],
    },
    CreateUserProfileHandler,
    GetUserProfileHandler,
  ],
})
export class UserProfileModule {}
