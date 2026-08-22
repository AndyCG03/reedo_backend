import { PrismaService } from '../../../src/prisma/prisma.service';
import { Comment } from '../../../src/modules/posts/domain/comment';
import { PrismaCommentRepository } from '../../../src/modules/posts/infrastructure/persistence/prisma/prisma-comment.repository';

describe('PrismaCommentRepository', () => {
  let prisma: {
    comment: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let adapter: PrismaCommentRepository;

  beforeEach(() => {
    prisma = {
      comment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    adapter = new PrismaCommentRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('persists the comment', async () => {
      const comment = Comment.create({
        id: 'comment-id',
        postId: 'post-id',
        userId: 'user-id',
        content: 'Great book',
      });
      (prisma.comment.create as jest.Mock).mockResolvedValue({});

      const result = await adapter.create(comment);

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          id: 'comment-id',
          postId: 'post-id',
          userId: 'user-id',
          content: 'Great book',
        },
      });
      expect(result).toEqual(comment);
    });
  });

  describe('findById', () => {
    it('returns the comment when found', async () => {
      const record = {
        id: 'comment-id',
        postId: 'post-id',
        userId: 'user-id',
        content: 'Great',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(record);

      const result = await adapter.findById('comment-id');

      expect(result).toBeInstanceOf(Comment);
      expect(result!.content).toBe('Great');
    });

    it('returns null when the comment does not exist', async () => {
      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await adapter.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt on the comment', async () => {
      (prisma.comment.update as jest.Mock).mockResolvedValue({});

      await adapter.softDelete('comment-id');

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-id' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('countByPost', () => {
    it('returns the count of non-deleted comments', async () => {
      (prisma.comment.count as jest.Mock).mockResolvedValue(3);

      const result = await adapter.countByPost('post-id');

      expect(result).toBe(3);
    });
  });
});
