import type { PaginatedResult, SieveOptions } from '../../../common/sieve';
import { User } from './user';

/**
 * DI token for the user repository port.
 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/**
 * Repository port (hexagonal "inward" contract) for the users slice.
 *
 * Application/handler code depends on this interface only. Concrete adapters
 * (Prisma/PostgreSQL now, others later) live in the
 * infrastructure folder and are bound to this token by the slice module.
 */
export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findMany(query: SieveOptions): Promise<PaginatedResult<User>>;
}
