import type { PaginatedResult, SieveOptions } from '../../../common/sieve';
import { Comment } from './comment';

export const COMMENT_REPOSITORY = Symbol('COMMENT_REPOSITORY');

export interface CommentWithAuthor {
  comment: Comment;
  author: { id: string; username: string };
}

export interface CommentRepository {
  create(comment: Comment): Promise<Comment>;
  findMany(
    postId: string,
    sieve: SieveOptions,
  ): Promise<PaginatedResult<CommentWithAuthor>>;
  findById(id: string): Promise<Comment | null>;
  update(id: string, data: { content: string }): Promise<Comment>;
  softDelete(id: string): Promise<void>;
  countByPost(postId: string): Promise<number>;
}
