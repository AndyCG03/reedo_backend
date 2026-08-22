import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SYNC_CHANGE_REPOSITORY } from './domain/sync-change.repository';
import { SyncController } from './sync.controller';
import { PullSyncHandler } from './features/pull-sync/pull-sync.handler';
import { PushSyncHandler } from './features/push-sync/push-sync.handler';
import { PrismaSyncChangeRepository } from './infrastructure/persistence/prisma/prisma-sync-change.repository';

@Module({
  imports: [CqrsModule],
  controllers: [SyncController],
  providers: [
    {
      provide: SYNC_CHANGE_REPOSITORY,
      useClass: PrismaSyncChangeRepository,
    },
    PullSyncHandler,
    PushSyncHandler,
  ],
})
export class SyncModule {}
