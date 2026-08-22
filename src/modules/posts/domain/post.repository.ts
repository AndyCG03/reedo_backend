import type { PaginatedResult, SieveOptions } from '../../../common/sieve';
import { Post } from './post';

export const POST_REPOSITORY = Symbol('POST_REPOSITORY');

export interface EnrichedPost {
  post: Post;
  author: { id: string; username: string };
  book: { id: string; title: string } | null;
  likesCount: number;
  commentsCount: number;
  likedByUser: boolean;
}

export interface PostRepository {
  create(post: Post): Promise<Post>;
  findById(id: string): Promise<EnrichedPost | null>;
  findMany(
    sieve: SieveOptions,
    filters?: { userId?: string; bookId?: string },
  ): Promise<PaginatedResult<EnrichedPost>>;
  update(id: string, data: { content: string }): Promise<Post>;
  softDelete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
}
