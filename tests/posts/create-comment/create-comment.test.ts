import { NotFoundException } from '@nestjs/common';
import { CreateCommentCommand } from '../../../src/modules/posts/features/create-comment/create-comment.command';
import { CreateCommentHandler } from '../../../src/modules/posts/features/create-comment/create-comment.handler';
import type { CommentRepository } from '../../../src/modules/posts/domain/comment.repository';
import type { PostRepository } from '../../../src/modules/posts/domain/post.repository';

describe('CreateCommentHandler', () => {
  let handler: CreateCommentHandler;
  let commentRepository: jest.Mocked<CommentRepository>;
  let postRepository: jest.Mocked<PostRepository>;

  beforeEach(() => {
    commentRepository = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
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
    handler = new CreateCommentHandler(commentRepository, postRepository);
  });

  it('creates a comment on an existing post', async () => {
    postRepository.existsById.mockResolvedValue(true);
    commentRepository.create.mockImplementation((c) =>
      Promise.resolve(c as never),
    );
    commentRepository.findMany.mockResolvedValue({
      data: [
        {
          comment: {
            id: 'comment-id',
            postId: 'post-id',
            userId: 'user-id',
            content: 'Great',
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          author: { id: 'user-id', username: 'bookworm' },
        },
      ],
      meta: { total: 1, page: 1, pageSize: 1, totalPages: 1, lastPage: 1 },
    });

    const result = await handler.execute(
      new CreateCommentCommand('post-id', 'user-id', 'Great'),
    );

    expect(commentRepository.create).toHaveBeenCalledTimes(1);
    expect(result.content).toBe('Great');
    expect(result.author.username).toBe('bookworm');
  });

  it('throws NotFoundException when the post does not exist', async () => {
    postRepository.existsById.mockResolvedValue(false);

    await expect(
      handler.execute(
        new CreateCommentCommand('missing', 'user-id', 'Comment'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
