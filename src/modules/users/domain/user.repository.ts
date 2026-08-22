import type { PaginatedResult, SieveOptions } from '../../../common/sieve';
import { User } from './user';

/** DI token for the user repository port. */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/**
 * Repository port for the users slice.
 */
export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findMany(query: SieveOptions): Promise<PaginatedResult<User>>;
}
