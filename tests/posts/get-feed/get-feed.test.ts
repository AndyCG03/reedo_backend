import { GetFeedQuery } from '../../../src/modules/posts/features/get-feed/get-feed.query';
import { GetFeedHandler } from '../../../src/modules/posts/features/get-feed/get-feed.handler';
import type { PostRepository } from '../../../src/modules/posts/domain/post.repository';
import type { PaginatedResult } from '../../../src/common/sieve';
import type { EnrichedPost } from '../../../src/modules/posts/domain/post.repository';

describe('GetFeedHandler', () => {
  let handler: GetFeedHandler;
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
    handler = new GetFeedHandler(repository);
  });

  it('returns a paginated envelope of posts ordered by creation date', async () => {
    const enriched: EnrichedPost = {
      post: {
        id: 'post-id',
        userId: 'user-id',
        bookId: null,
        content: 'Latest post',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      author: { id: 'user-id', username: 'bookworm' },
      book: null,
      likesCount: 2,
      commentsCount: 0,
      likedByUser: false,
    };
    const paginated: PaginatedResult<EnrichedPost> = {
      data: [enriched],
      meta: { total: 1, page: 1, pageSize: 20, totalPages: 1, lastPage: 1 },
    };
    repository.findMany.mockResolvedValue(paginated);

    const result = await handler.execute(
      new GetFeedQuery({ page: 1, pageSize: 20 }, 'user-id'),
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].content).toBe('Latest post');
    expect(result.meta.total).toBe(1);
  });
});
