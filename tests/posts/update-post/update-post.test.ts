import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdatePostCommand } from '../../../src/modules/posts/features/update-post/update-post.command';
import { UpdatePostHandler } from '../../../src/modules/posts/features/update-post/update-post.handler';
import type { PostRepository } from '../../../src/modules/posts/domain/post.repository';

describe('UpdatePostHandler', () => {
  let handler: UpdatePostHandler;
  let repository: jest.Mocked<PostRepository>;

  const enrichedPost = {
    post: {
      id: 'post-id',
      userId: 'user-id',
      bookId: null,
      content: 'Old content',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    author: { id: 'user-id', username: 'bookworm' },
    book: null,
    likesCount: 0,
    commentsCount: 0,
    likedByUser: false,
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      existsById: jest.fn(),
    };
    handler = new UpdatePostHandler(repository);
  });

  it('updates the post when the user is the owner', async () => {
    repository.findById
      .mockResolvedValueOnce(enrichedPost)
      .mockResolvedValueOnce({
        ...enrichedPost,
        post: { ...enrichedPost.post, content: 'New content' },
      });
    repository.update.mockImplementation((id, data) =>
      Promise.resolve({
        ...enrichedPost.post,
        content: data.content,
      } as never),
    );

    const result = await handler.execute(
      new UpdatePostCommand('post-id', 'user-id', 'New content'),
    );

    expect(repository.update).toHaveBeenCalledWith('post-id', {
      content: 'New content',
    });
    expect(result.content).toBe('New content');
  });

  it('throws ForbiddenException when the user is not the owner', async () => {
    repository.findById.mockResolvedValue(enrichedPost);

    await expect(
      handler.execute(new UpdatePostCommand('post-id', 'other-user', 'Hacked')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFoundException when the post does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdatePostCommand('missing', 'user-id', 'Content')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
