import { ConflictException, NotFoundException } from '@nestjs/common';
import { LikePostCommand } from '../../../src/modules/posts/features/like-post/like-post.command';
import { LikePostHandler } from '../../../src/modules/posts/features/like-post/like-post.handler';
import type { PostLikeRepository } from '../../../src/modules/posts/domain/post-like.repository';
import type { PostRepository } from '../../../src/modules/posts/domain/post.repository';

describe('LikePostHandler', () => {
  let handler: LikePostHandler;
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
    handler = new LikePostHandler(likeRepository, postRepository);
  });

  it('creates a like when the post exists and user has not liked it', async () => {
    postRepository.existsById.mockResolvedValue(true);
    likeRepository.existsByPostAndUser.mockResolvedValue(false);
    likeRepository.create.mockImplementation((like) =>
      Promise.resolve(like as never),
    );

    await handler.execute(new LikePostCommand('post-id', 'user-id'));

    expect(likeRepository.create).toHaveBeenCalledTimes(1);
    expect(likeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ postId: 'post-id', userId: 'user-id' }),
    );
  });

  it('throws ConflictException when the user already liked the post', async () => {
    postRepository.existsById.mockResolvedValue(true);
    likeRepository.existsByPostAndUser.mockResolvedValue(true);

    await expect(
      handler.execute(new LikePostCommand('post-id', 'user-id')),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException when the post does not exist', async () => {
    postRepository.existsById.mockResolvedValue(false);

    await expect(
      handler.execute(new LikePostCommand('missing', 'user-id')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
