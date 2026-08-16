import type {
  CursorPaginated,
  Paginated,
  PaginateQuery,
} from '@nestarc/pagination';
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
 *
 * The listing method follows the @nestarc/pagination query contract so that
 * filtering, sorting and pagination stay agnostic to the storage layer.
 */
export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findMany(
    query: PaginateQuery,
  ): Promise<Paginated<User> | CursorPaginated<User>>;
}
