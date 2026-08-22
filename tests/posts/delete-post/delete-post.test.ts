import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeletePostCommand } from '../../../src/modules/posts/features/delete-post/delete-post.command';
import { DeletePostHandler } from '../../../src/modules/posts/features/delete-post/delete-post.handler';
import type { PostRepository } from '../../../src/modules/posts/domain/post.repository';

describe('DeletePostHandler', () => {
  let handler: DeletePostHandler;
  let repository: jest.Mocked<PostRepository>;

  const enrichedPost = {
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
    handler = new DeletePostHandler(repository);
  });

  it('soft deletes the post when the user is the owner', async () => {
    repository.findById.mockResolvedValue(enrichedPost);
    repository.softDelete.mockResolvedValue(undefined);

    await handler.execute(new DeletePostCommand('post-id', 'user-id'));

    expect(repository.softDelete).toHaveBeenCalledWith('post-id');
  });

  it('throws ForbiddenException when the user is not the owner', async () => {
    repository.findById.mockResolvedValue(enrichedPost);

    await expect(
      handler.execute(new DeletePostCommand('post-id', 'other-user')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFoundException when the post does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new DeletePostCommand('missing', 'user-id')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
