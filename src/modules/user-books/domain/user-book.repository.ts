import type { PaginatedResult, SieveOptions } from '../../../common/sieve';
import { UserBook } from './user-book';

export const USER_BOOK_REPOSITORY = Symbol('USER_BOOK_REPOSITORY');

export interface UserBookRepository {
  create(userBook: UserBook): Promise<UserBook>;
  findById(id: string): Promise<UserBook | null>;
  findByUserAndBook(userId: string, bookId: string): Promise<UserBook | null>;
  findByUserId(
    userId: string,
    query: SieveOptions,
  ): Promise<PaginatedResult<UserBook>>;
  update(userBook: UserBook): Promise<UserBook>;
}
