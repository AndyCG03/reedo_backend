import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateCommentCommand } from '../../../src/modules/posts/features/update-comment/update-comment.command';
import { UpdateCommentHandler } from '../../../src/modules/posts/features/update-comment/update-comment.handler';
import type { CommentRepository } from '../../../src/modules/posts/domain/comment.repository';

describe('UpdateCommentHandler', () => {
  let handler: UpdateCommentHandler;
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
    handler = new UpdateCommentHandler(commentRepository);
  });

  it('updates the comment when the user is the owner', async () => {
    commentRepository.findById.mockResolvedValue({
      id: 'comment-id',
      postId: 'post-id',
      userId: 'user-id',
      content: 'Old',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    commentRepository.update.mockImplementation((id, data) =>
      Promise.resolve({
        id: 'comment-id',
        postId: 'post-id',
        userId: 'user-id',
        content: data.content,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never),
    );

    const result = await handler.execute(
      new UpdateCommentCommand('comment-id', 'user-id', 'New'),
    );

    expect(result.content).toBe('New');
  });

  it('throws ForbiddenException when the user is not the owner', async () => {
    commentRepository.findById.mockResolvedValue({
      id: 'comment-id',
      postId: 'post-id',
      userId: 'user-id',
      content: 'Old',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      handler.execute(
        new UpdateCommentCommand('comment-id', 'other', 'Hacked'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFoundException when the comment does not exist', async () => {
    commentRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new UpdateCommentCommand('missing', 'user-id', 'Content'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
