import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { RefreshToken } from '../../../domain/refresh-token';
import type { RefreshTokenRepository } from '../../../domain/refresh-token.repository';

/**
 * PostgreSQL (Prisma) adapter for the refresh-token repository port.
 */
@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(token: RefreshToken): Promise<RefreshToken> {
    await this.prisma.refreshToken.create({
      data: {
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
        revokedAt: token.revokedAt,
      },
    });
    return token;
  }

  public async findById(id: string): Promise<RefreshToken | null> {
    const record = await this.prisma.refreshToken.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  public async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const record = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
    });
    return record ? this.toDomain(record) : null;
  }

  public async revokeById(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  public async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private toDomain(record: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    revokedAt: Date | null;
  }): RefreshToken {
    return new RefreshToken(
      record.id,
      record.userId,
      record.tokenHash,
      record.expiresAt,
      record.createdAt,
      record.revokedAt,
    );
  }
}
