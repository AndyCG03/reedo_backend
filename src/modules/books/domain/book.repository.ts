import type { PaginatedResult, SieveOptions } from '../../../common/sieve';
import { Book } from './book';

export const BOOK_REPOSITORY = Symbol('BOOK_REPOSITORY');

export interface BookRepository {
  create(book: Book): Promise<Book>;
  findById(id: string): Promise<Book | null>;
  findMany(query: SieveOptions): Promise<PaginatedResult<Book>>;
}
