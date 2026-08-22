import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  SYNC_CHANGE_REPOSITORY,
  type SyncChangeRepository,
} from '../../domain/sync-change.repository';
import { SyncChange } from '../../domain/sync-change';
import {
  PushResultItemDto,
  PushSyncResponseDto,
} from '../../dto/push-sync-response.dto';
import { PushSyncCommand } from './push-sync.command';

@CommandHandler(PushSyncCommand)
export class PushSyncHandler implements ICommandHandler<PushSyncCommand> {
  private readonly logger = new Logger(PushSyncHandler.name);

  public constructor(
    @Inject(SYNC_CHANGE_REPOSITORY)
    private readonly repository: SyncChangeRepository,
  ) {}

  public async execute(command: PushSyncCommand): Promise<PushSyncResponseDto> {
    const results: PushResultItemDto[] = [];
    const conflicts: PushResultItemDto[] = [];
    let lastSequence = 0;

    for (const change of command.changes) {
      const isDuplicate = await this.repository.existsByChangeId(
        command.userId,
        change.changeId,
      );

      if (isDuplicate) {
        results.push({
          changeId: change.changeId,
          status: 'duplicate',
        });
        continue;
      }

      const nextSequence = await this.repository.getNextSequence(
        command.userId,
      );

      const syncChange = SyncChange.create({
        id: BigInt(0),
        userId: command.userId,
        sequence: nextSequence,
        changeId: change.changeId,
        entity: change.entity,
        entityId: change.entityId,
        operation: change.operation,
        payload: {
          ...change.data,
          _baseVersion: change.baseVersion,
        },
      });

      await this.repository.create(syncChange);

      results.push({
        changeId: change.changeId,
        status: 'accepted',
        entityId: change.entityId,
        version: change.baseVersion + 1,
      });

      lastSequence = nextSequence;
    }

    const cursor =
      lastSequence > 0
        ? lastSequence
        : (await this.repository.getNextSequence(command.userId)) - 1;

    return {
      results,
      conflicts,
      cursor,
    };
  }
}
