import { UserProfile } from './user-profile';

/**
 * DI token for the user profile repository port.
 */
export const USER_PROFILE_REPOSITORY = Symbol('USER_PROFILE_REPOSITORY');

/**
 * Repository port (hexagonal "inward" contract) for the user profile slice.
 *
 * Application/handler code depends on this interface only. Concrete adapters
 * (TypeORM/PostgreSQL now, Supabase/Firebase later) live in the
 * infrastructure folder and are bound to this token by the slice module.
 */
export interface UserProfileRepository {
  create(profile: UserProfile): Promise<UserProfile>;
  findById(id: string): Promise<UserProfile | null>;
  findByUsername(username: string): Promise<UserProfile | null>;
}
