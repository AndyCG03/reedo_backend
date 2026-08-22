import { SyncChange } from './sync-change';

export const SYNC_CHANGE_REPOSITORY = Symbol('SYNC_CHANGE_REPOSITORY');

export interface SyncChangeRepository {
  create(syncChange: SyncChange): Promise<SyncChange>;
  findChangesAfterCursor(
    userId: string,
    cursor: number,
    limit?: number,
  ): Promise<SyncChange[]>;
  getNextSequence(userId: string): Promise<number>;
  existsByChangeId(userId: string, changeId: string): Promise<boolean>;
  findById(id: bigint): Promise<SyncChange | null>;
}
