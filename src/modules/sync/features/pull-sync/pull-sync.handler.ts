import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  SYNC_CHANGE_REPOSITORY,
  type SyncChangeRepository,
} from '../../domain/sync-change.repository';
import { SyncChangeDto } from '../../dto/sync-change.dto';
import { PullSyncResponseDto } from '../../dto/pull-sync.dto';
import { PullSyncQuery } from './pull-sync.query';

@QueryHandler(PullSyncQuery)
export class PullSyncHandler implements IQueryHandler<PullSyncQuery> {
  public constructor(
    @Inject(SYNC_CHANGE_REPOSITORY)
    private readonly repository: SyncChangeRepository,
  ) {}

  public async execute(query: PullSyncQuery): Promise<PullSyncResponseDto> {
    const changes = await this.repository.findChangesAfterCursor(
      query.userId,
      query.cursor,
    );

    const cursor =
      changes.length > 0 ? changes[changes.length - 1].sequence : query.cursor;

    return {
      changes: changes.map((change) => SyncChangeDto.fromDomain(change)),
      cursor,
    };
  }
}
