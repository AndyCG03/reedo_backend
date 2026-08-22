import { ListPostsQuery } from '../../../src/modules/posts/features/list-posts/list-posts.query';
import { ListPostsHandler } from '../../../src/modules/posts/features/list-posts/list-posts.handler';
import type { PostRepository } from '../../../src/modules/posts/domain/post.repository';
import type { PaginatedResult } from '../../../src/common/sieve';
import type { EnrichedPost } from '../../../src/modules/posts/domain/post.repository';

describe('ListPostsHandler', () => {
  let handler: ListPostsHandler;
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
    handler = new ListPostsHandler(repository);
  });

  it('returns a paginated envelope of post DTOs', async () => {
    const enriched: EnrichedPost = {
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
      likesCount: 3,
      commentsCount: 1,
      likedByUser: false,
    };
    const paginated: PaginatedResult<EnrichedPost> = {
      data: [enriched],
      meta: { total: 1, page: 1, pageSize: 20, totalPages: 1, lastPage: 1 },
    };
    repository.findMany.mockResolvedValue(paginated);

    const result = await handler.execute(
      new ListPostsQuery({ page: 1, pageSize: 20 }),
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('post-id');
    expect(result.meta.total).toBe(1);
  });
});
