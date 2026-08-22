import { ListCommentsQuery } from '../../../src/modules/posts/features/list-comments/list-comments.query';
import { ListCommentsHandler } from '../../../src/modules/posts/features/list-comments/list-comments.handler';
import type { CommentRepository } from '../../../src/modules/posts/domain/comment.repository';
import type { PaginatedResult } from '../../../src/common/sieve';
import type { CommentWithAuthor } from '../../../src/modules/posts/domain/comment.repository';

describe('ListCommentsHandler', () => {
  let handler: ListCommentsHandler;
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
    handler = new ListCommentsHandler(commentRepository);
  });

  it('returns a paginated envelope of comment DTOs', async () => {
    const enriched: CommentWithAuthor = {
      comment: {
        id: 'comment-id',
        postId: 'post-id',
        userId: 'user-id',
        content: 'Nice',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      author: { id: 'user-id', username: 'bookworm' },
    };
    const paginated: PaginatedResult<CommentWithAuthor> = {
      data: [enriched],
      meta: { total: 1, page: 1, pageSize: 20, totalPages: 1, lastPage: 1 },
    };
    commentRepository.findMany.mockResolvedValue(paginated);

    const result = await handler.execute(
      new ListCommentsQuery('post-id', { page: 1, pageSize: 20 }),
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].content).toBe('Nice');
    expect(result.meta.total).toBe(1);
  });
});
