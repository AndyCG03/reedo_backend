import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Post } from '../../../domain/post';
import type {
  EnrichedPost,
  PostRepository,
} from '../../../domain/post.repository';
import type {
  PaginatedResult,
  SieveOptions,
} from '../../../../../common/sieve/sieve-options';
import { PrismaSieve } from '../../../../../common/sieve/prisma-sieve';
import { PostSieveConfig } from './post.sieve';

const POST_INCLUDE = {
  user: { select: { id: true, username: true } },
  book: { select: { id: true, title: true } },
  _count: { select: { postLikes: true, comments: true } },
} as const;

type PostWithRelations = Awaited<
  ReturnType<PrismaService['post']['findUnique']>
> & {
  user: { id: string; username: string };
  book: { id: string; title: string } | null;
  _count: { postLikes: number; comments: number };
};

@Injectable()
export class PrismaPostRepository implements PostRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(post: Post): Promise<Post> {
    await this.prisma.post.create({
      data: {
        id: post.id,
        userId: post.userId,
        bookId: post.bookId,
        content: post.content,
      },
    });
    return post;
  }

  public async findById(
    id: string,
    userId?: string,
  ): Promise<EnrichedPost | null> {
    const record = await this.prisma.post.findUnique({
      where: { id, deletedAt: null },
      include: POST_INCLUDE,
    });

    if (!record) return null;

    let likedByUser = false;
    if (userId) {
      const like = await this.prisma.postLike.findUnique({
        where: { postId_userId: { postId: id, userId } },
      });
      likedByUser = !!like;
    }

    return this.toEnriched(record, likedByUser);
  }

  public async findMany(
    sieve: SieveOptions,
    filters?: { userId?: string; bookId?: string },
  ): Promise<PaginatedResult<EnrichedPost>> {
    const baseWhere: Record<string, unknown> = { deletedAt: null };

    if (filters?.userId) {
      baseWhere.userId = filters.userId;
    }
    if (filters?.bookId) {
      baseWhere.bookId = filters.bookId;
    }

    const sieveWhere = PrismaSieve.build(sieve, PostSieveConfig);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const where = sieveWhere.where.AND?.length
      ? { AND: [baseWhere, sieveWhere.where] }
      : baseWhere;

    const orderBy = sieveWhere.orderBy.length
      ? sieveWhere.orderBy
      : { createdAt: 'desc' as const };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        orderBy,
        skip: sieveWhere.skip,
        take: sieveWhere.take,
        include: POST_INCLUDE,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: (records as PostWithRelations[]).map((r) =>
        this.toEnriched(r, false),
      ),
      meta: {
        total,
        page: sieve.page,
        pageSize: sieve.pageSize,
        totalPages: Math.ceil(total / sieve.pageSize),
        lastPage: Math.ceil(total / sieve.pageSize),
      },
    };
  }

  public async update(id: string, data: { content: string }): Promise<Post> {
    const record = await this.prisma.post.update({
      where: { id },
      data: { content: data.content },
    });
    return new Post(
      record.id,
      record.userId,
      record.bookId,
      record.content,
      record.deletedAt,
      record.createdAt,
      record.updatedAt,
    );
  }

  public async softDelete(id: string): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  public async existsById(id: string): Promise<boolean> {
    const record = await this.prisma.post.findUnique({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    return !!record;
  }

  private toEnriched(
    record: PostWithRelations,
    likedByUser: boolean,
  ): EnrichedPost {
    return {
      post: new Post(
        record.id,
        record.userId,
        record.bookId,
        record.content,
        record.deletedAt,
        record.createdAt,
        record.updatedAt,
      ),
      author: record.user,
      book: record.book,
      likesCount: record._count.postLikes,
      commentsCount: record._count.comments,
      likedByUser,
    };
  }
}
