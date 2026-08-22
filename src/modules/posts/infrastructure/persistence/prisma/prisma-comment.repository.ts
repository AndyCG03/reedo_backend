import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { Comment } from '../../../domain/comment';
import type {
  CommentRepository,
  CommentWithAuthor,
} from '../../../domain/comment.repository';
import type {
  PaginatedResult,
  SieveOptions,
} from '../../../../../common/sieve/sieve-options';
import { PrismaSieve } from '../../../../../common/sieve/prisma-sieve';
import { CommentSieveConfig } from './comment.sieve';

const COMMENT_INCLUDE = {
  user: { select: { id: true, username: true } },
} as const;

type CommentWithRelations = Awaited<
  ReturnType<PrismaService['comment']['findUnique']>
> & {
  user: { id: string; username: string };
};

@Injectable()
export class PrismaCommentRepository implements CommentRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(comment: Comment): Promise<Comment> {
    await this.prisma.comment.create({
      data: {
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        content: comment.content,
      },
    });
    return comment;
  }

  public async findMany(
    postId: string,
    sieve: SieveOptions,
  ): Promise<PaginatedResult<CommentWithAuthor>> {
    const baseWhere = { postId, deletedAt: null };

    const sieveResult = PrismaSieve.build(sieve, CommentSieveConfig);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const where = sieveResult.where.AND?.length
      ? { AND: [baseWhere, sieveResult.where] }
      : baseWhere;

    const orderBy = sieveResult.orderBy.length
      ? sieveResult.orderBy
      : { createdAt: 'asc' as const };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        orderBy,
        skip: sieveResult.skip,
        take: sieveResult.take,
        include: COMMENT_INCLUDE,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      data: (records as CommentWithRelations[]).map((r) =>
        this.toAuthorComment(r),
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

  public async findById(id: string): Promise<Comment | null> {
    const record = await this.prisma.comment.findUnique({
      where: { id, deletedAt: null },
    });
    if (!record) return null;
    return new Comment(
      record.id,
      record.postId,
      record.userId,
      record.content,
      record.deletedAt,
      record.createdAt,
      record.updatedAt,
    );
  }

  public async update(id: string, data: { content: string }): Promise<Comment> {
    const record = await this.prisma.comment.update({
      where: { id },
      data: { content: data.content },
    });
    return new Comment(
      record.id,
      record.postId,
      record.userId,
      record.content,
      record.deletedAt,
      record.createdAt,
      record.updatedAt,
    );
  }

  public async softDelete(id: string): Promise<void> {
    await this.prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  public async countByPost(postId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { postId, deletedAt: null },
    });
  }

  private toAuthorComment(record: CommentWithRelations): CommentWithAuthor {
    return {
      comment: new Comment(
        record.id,
        record.postId,
        record.userId,
        record.content,
        record.deletedAt,
        record.createdAt,
        record.updatedAt,
      ),
      author: record.user,
    };
  }
}
