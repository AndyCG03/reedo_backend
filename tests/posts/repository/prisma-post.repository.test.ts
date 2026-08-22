import { PrismaService } from '../../../src/prisma/prisma.service';
import { Post } from '../../../src/modules/posts/domain/post';
import { PrismaPostRepository } from '../../../src/modules/posts/infrastructure/persistence/prisma/prisma-post.repository';

describe('PrismaPostRepository', () => {
  let prisma: {
    post: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    postLike: {
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let adapter: PrismaPostRepository;

  beforeEach(() => {
    prisma = {
      post: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      postLike: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    adapter = new PrismaPostRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('persists the domain model through the Prisma adapter', async () => {
      const post = Post.create({
        id: 'post-id',
        userId: 'user-id',
        content: 'Hello world',
      });
      (prisma.post.create as jest.Mock).mockResolvedValue({});

      const result = await adapter.create(post);

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          id: 'post-id',
          userId: 'user-id',
          bookId: null,
          content: 'Hello world',
        },
      });
      expect(result).toEqual(post);
    });
  });

  describe('findById', () => {
    it('returns enriched post when found', async () => {
      const record = {
        id: 'post-id',
        userId: 'user-id',
        bookId: null,
        content: 'Hello',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'user-id', username: 'bookworm' },
        book: null,
        _count: { postLikes: 3, comments: 2 },
      };
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(record);
      (prisma.postLike.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await adapter.findById('post-id', 'other-user');

      expect(result).not.toBeNull();
      expect(result!.post.id).toBe('post-id');
      expect(result!.author.username).toBe('bookworm');
      expect(result!.likesCount).toBe(3);
      expect(result!.commentsCount).toBe(2);
      expect(result!.likedByUser).toBe(false);
    });

    it('detects when user has liked the post', async () => {
      const record = {
        id: 'post-id',
        userId: 'user-id',
        bookId: null,
        content: 'Hello',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'user-id', username: 'bookworm' },
        book: null,
        _count: { postLikes: 1, comments: 0 },
      };
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(record);
      (prisma.postLike.findUnique as jest.Mock).mockResolvedValue({
        id: 'like-id',
      });

      const result = await adapter.findById('post-id', 'user-id');

      expect(result!.likedByUser).toBe(true);
    });

    it('returns null when the post does not exist', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await adapter.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt on the post', async () => {
      (prisma.post.update as jest.Mock).mockResolvedValue({});

      await adapter.softDelete('post-id');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-id' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('existsById', () => {
    it('returns true when the post exists', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: 'post-id',
      });

      const result = await adapter.existsById('post-id');

      expect(result).toBe(true);
    });

    it('returns false when the post does not exist', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await adapter.existsById('missing');

      expect(result).toBe(false);
    });
  });
});
