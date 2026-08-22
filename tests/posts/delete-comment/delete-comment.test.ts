import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteCommentCommand } from '../../../src/modules/posts/features/delete-comment/delete-comment.command';
import { DeleteCommentHandler } from '../../../src/modules/posts/features/delete-comment/delete-comment.handler';
import type { CommentRepository } from '../../../src/modules/posts/domain/comment.repository';

describe('DeleteCommentHandler', () => {
  let handler: DeleteCommentHandler;
  let commentRepository: jest.Mocked<CommentRepository>;

  beforeEach(() => {
    commentRepository = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      countByPost: jest.fn(),
    };
    handler = new DeleteCommentHandler(commentRepository);
  });

  it('soft deletes the comment when the user is the owner', async () => {
    commentRepository.findById.mockResolvedValue({
      id: 'comment-id',
      postId: 'post-id',
      userId: 'user-id',
      content: 'Hello',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    commentRepository.softDelete.mockResolvedValue(undefined);

    await handler.execute(new DeleteCommentCommand('comment-id', 'user-id'));

    expect(commentRepository.softDelete).toHaveBeenCalledWith('comment-id');
  });

  it('throws ForbiddenException when the user is not the owner', async () => {
    commentRepository.findById.mockResolvedValue({
      id: 'comment-id',
      postId: 'post-id',
      userId: 'user-id',
      content: 'Hello',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      handler.execute(new DeleteCommentCommand('comment-id', 'other')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFoundException when the comment does not exist', async () => {
    commentRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteCommentCommand('missing', 'user-id')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
