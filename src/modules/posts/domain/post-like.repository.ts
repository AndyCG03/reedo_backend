import { PostLike } from './post-like';

export const POST_LIKE_REPOSITORY = Symbol('POST_LIKE_REPOSITORY');

export interface PostLikeRepository {
  create(like: PostLike): Promise<PostLike>;
  delete(postId: string, userId: string): Promise<void>;
  existsByPostAndUser(postId: string, userId: string): Promise<boolean>;
  countByPost(postId: string): Promise<number>;
}
