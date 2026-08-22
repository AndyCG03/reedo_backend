import { NotFoundException } from '@nestjs/common';
import { GetPostQuery } from '../../../src/modules/posts/features/get-post/get-post.query';
import { GetPostHandler } from '../../../src/modules/posts/features/get-post/get-post.handler';
import type { PostRepository } from '../../../src/modules/posts/domain/post.repository';

describe('GetPostHandler', () => {
  let handler: GetPostHandler;
  let repository: jest.Mocked<PostRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      existsById: jest.fn(),
    };
    handler = new GetPostHandler(repository);
  });

  it('returns the enriched post when found', async () => {
    const enriched = {
      post: {
        id: 'post-id',
        userId: 'user-id',
        bookId: null,
        content: 'Hello',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      author: { id: 'user-id', username: 'bookworm' },
      book: null,
      likesCount: 5,
      commentsCount: 2,
      likedByUser: true,
    };
    repository.findById.mockResolvedValue(enriched);

    const result = await handler.execute(
      new GetPostQuery('post-id', 'user-id'),
    );

    expect(result.id).toBe('post-id');
    expect(result.likesCount).toBe(5);
    expect(result.likedByMe).toBe(true);
  });

  it('throws NotFoundException when the post does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetPostQuery('missing-id', 'user-id')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
