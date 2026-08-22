import { CreatePostCommand } from '../../../src/modules/posts/features/create-post/create-post.command';
import { CreatePostHandler } from '../../../src/modules/posts/features/create-post/create-post.handler';
import type { PostRepository } from '../../../src/modules/posts/domain/post.repository';

describe('CreatePostHandler', () => {
  let handler: CreatePostHandler;
  let repository: jest.Mocked<PostRepository>;

  const enrichedPost = {
    post: {
      id: 'post-id',
      userId: 'user-id',
      bookId: null,
      content: 'Me encantó este libro',
      deletedAt: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
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
    handler = new CreatePostHandler(repository);
  });

  it('creates and persists a post', async () => {
    repository.create.mockImplementation((post) =>
      Promise.resolve(post as never),
    );
    repository.findById.mockResolvedValue(enrichedPost);

    const result = await handler.execute(
      new CreatePostCommand('user-id', 'Me encantó este libro'),
    );

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-id',
        content: 'Me encantó este libro',
        bookId: null,
      }),
    );
    expect(result.id).toBeDefined();
    expect(result.content).toBe('Me encantó este libro');
    expect(result.author.username).toBe('bookworm');
  });

  it('creates a post with optional bookId', async () => {
    repository.create.mockImplementation((post) =>
      Promise.resolve(post as never),
    );
    repository.findById.mockResolvedValue({
      ...enrichedPost,
      book: { id: 'book-id', title: 'La bella y la bestia' },
    });

    const result = await handler.execute(
      new CreatePostCommand('user-id', 'Great book', 'book-id'),
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ bookId: 'book-id' }),
    );
    expect(result.book?.title).toBe('La bella y la bestia');
  });
});
