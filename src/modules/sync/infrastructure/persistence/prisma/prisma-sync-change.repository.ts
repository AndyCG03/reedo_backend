import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { SyncChange } from '../../../domain/sync-change';
import type { SyncChangeRepository } from '../../../domain/sync-change.repository';

@Injectable()
export class PrismaSyncChangeRepository implements SyncChangeRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(syncChange: SyncChange): Promise<SyncChange> {
    const record = await this.prisma.syncChange.create({
      data: {
        userId: syncChange.userId,
        sequence: syncChange.sequence,
        changeId: syncChange.changeId,
        entity: syncChange.entity,
        entityId: syncChange.entityId,
        operation: syncChange.operation,
        payload: syncChange.payload as Prisma.InputJsonValue,
      },
    });

    return new SyncChange(
      record.id,
      record.userId,
      record.sequence,
      record.changeId,
      record.entity,
      record.entityId,
      record.operation,
      record.payload as Record<string, unknown>,
      record.createdAt,
    );
  }

  public async findChangesAfterCursor(
    userId: string,
    cursor: number,
    limit: number = 100,
  ): Promise<SyncChange[]> {
    const records = await this.prisma.syncChange.findMany({
      where: {
        userId,
        sequence: { gt: cursor },
      },
      orderBy: { sequence: 'asc' },
      take: limit,
    });

    return records.map(
      (record) =>
        new SyncChange(
          record.id,
          record.userId,
          record.sequence,
          record.changeId,
          record.entity,
          record.entityId,
          record.operation,
          record.payload as Record<string, unknown>,
          record.createdAt,
        ),
    );
  }

  public async getNextSequence(userId: string): Promise<number> {
    const last = await this.prisma.syncChange.findFirst({
      where: { userId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });

    return last ? last.sequence + 1 : 1;
  }

  public async existsByChangeId(
    userId: string,
    changeId: string,
  ): Promise<boolean> {
    const record = await this.prisma.syncChange.findUnique({
      where: { userId_changeId: { userId, changeId } },
      select: { id: true },
    });

    return record !== null;
  }

  public async findById(id: bigint): Promise<SyncChange | null> {
    const record = await this.prisma.syncChange.findUnique({
      where: { id },
    });

    if (!record) return null;

    return new SyncChange(
      record.id,
      record.userId,
      record.sequence,
      record.changeId,
      record.entity,
      record.entityId,
      record.operation,
      record.payload as Record<string, unknown>,
      record.createdAt,
    );
  }
}
