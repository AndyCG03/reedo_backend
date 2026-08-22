import { NotFoundException } from '@nestjs/common';
import { UnlikePostCommand } from '../../../src/modules/posts/features/unlike-post/unlike-post.command';
import { UnlikePostHandler } from '../../../src/modules/posts/features/unlike-post/unlike-post.handler';
import type { PostLikeRepository } from '../../../src/modules/posts/domain/post-like.repository';
import type { PostRepository } from '../../../src/modules/posts/domain/post.repository';

describe('UnlikePostHandler', () => {
  let handler: UnlikePostHandler;
  let likeRepository: jest.Mocked<PostLikeRepository>;
  let postRepository: jest.Mocked<PostRepository>;

  beforeEach(() => {
    likeRepository = {
      create: jest.fn(),
      delete: jest.fn(),
      existsByPostAndUser: jest.fn(),
      countByPost: jest.fn(),
    };
    postRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      existsById: jest.fn(),
    };
    handler = new UnlikePostHandler(likeRepository, postRepository);
  });

  it('removes the like when the post exists', async () => {
    postRepository.existsById.mockResolvedValue(true);
    likeRepository.delete.mockResolvedValue(undefined);

    await handler.execute(new UnlikePostCommand('post-id', 'user-id'));

    expect(likeRepository.delete).toHaveBeenCalledWith('post-id', 'user-id');
  });

  it('throws NotFoundException when the post does not exist', async () => {
    postRepository.existsById.mockResolvedValue(false);

    await expect(
      handler.execute(new UnlikePostCommand('missing', 'user-id')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
