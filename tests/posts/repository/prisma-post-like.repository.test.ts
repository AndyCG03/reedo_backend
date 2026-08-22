import { PrismaService } from '../../../src/prisma/prisma.service';
import { PostLike } from '../../../src/modules/posts/domain/post-like';
import { PrismaPostLikeRepository } from '../../../src/modules/posts/infrastructure/persistence/prisma/prisma-post-like.repository';

describe('PrismaPostLikeRepository', () => {
  let prisma: {
    postLike: {
      create: jest.Mock;
      deleteMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
    };
  };
  let adapter: PrismaPostLikeRepository;

  beforeEach(() => {
    prisma = {
      postLike: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
    };
    adapter = new PrismaPostLikeRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('persists the like', async () => {
      const like = PostLike.create({
        id: 'like-id',
        postId: 'post-id',
        userId: 'user-id',
      });
      (prisma.postLike.create as jest.Mock).mockResolvedValue({});

      const result = await adapter.create(like);

      expect(prisma.postLike.create).toHaveBeenCalledWith({
        data: { id: 'like-id', postId: 'post-id', userId: 'user-id' },
      });
      expect(result).toEqual(like);
    });
  });

  describe('delete', () => {
    it('removes the like', async () => {
      (prisma.postLike.deleteMany as jest.Mock).mockResolvedValue({});

      await adapter.delete('post-id', 'user-id');

      expect(prisma.postLike.deleteMany).toHaveBeenCalledWith({
        where: { postId: 'post-id', userId: 'user-id' },
      });
    });
  });

  describe('existsByPostAndUser', () => {
    it('returns true when the like exists', async () => {
      (prisma.postLike.findUnique as jest.Mock).mockResolvedValue({
        id: 'like-id',
      });

      const result = await adapter.existsByPostAndUser('post-id', 'user-id');

      expect(result).toBe(true);
    });

    it('returns false when the like does not exist', async () => {
      (prisma.postLike.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await adapter.existsByPostAndUser('post-id', 'user-id');

      expect(result).toBe(false);
    });
  });

  describe('countByPost', () => {
    it('returns the count of likes for a post', async () => {
      (prisma.postLike.count as jest.Mock).mockResolvedValue(5);

      const result = await adapter.countByPost('post-id');

      expect(result).toBe(5);
    });
  });
});
