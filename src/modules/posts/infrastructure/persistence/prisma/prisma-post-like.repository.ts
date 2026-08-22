import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { PostLike } from '../../../domain/post-like';
import type { PostLikeRepository } from '../../../domain/post-like.repository';

@Injectable()
export class PrismaPostLikeRepository implements PostLikeRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(like: PostLike): Promise<PostLike> {
    await this.prisma.postLike.create({
      data: {
        id: like.id,
        postId: like.postId,
        userId: like.userId,
      },
    });
    return like;
  }

  public async delete(postId: string, userId: string): Promise<void> {
    await this.prisma.postLike.deleteMany({
      where: { postId, userId },
    });
  }

  public async existsByPostAndUser(
    postId: string,
    userId: string,
  ): Promise<boolean> {
    const record = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
      select: { id: true },
    });
    return !!record;
  }

  public async countByPost(postId: string): Promise<number> {
    return this.prisma.postLike.count({ where: { postId } });
  }
}
