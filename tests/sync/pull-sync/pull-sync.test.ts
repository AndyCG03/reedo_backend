import { SyncChangeRepository } from '../../../src/modules/sync/domain/sync-change.repository';
import { PullSyncHandler } from '../../../src/modules/sync/features/pull-sync/pull-sync.handler';
import { PullSyncQuery } from '../../../src/modules/sync/features/pull-sync/pull-sync.query';

describe('PullSyncHandler', () => {
  let handler: PullSyncHandler;
  let repository: jest.Mocked<SyncChangeRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findChangesAfterCursor: jest.fn(),
      getNextSequence: jest.fn(),
      existsByChangeId: jest.fn(),
      findById: jest.fn(),
    };
    handler = new PullSyncHandler(repository);
  });

  it('returns empty changes when cursor is up to date', async () => {
    repository.findChangesAfterCursor.mockResolvedValue([]);

    const result = await handler.execute(new PullSyncQuery('user-id', 106));

    expect(repository.findChangesAfterCursor).toHaveBeenCalledWith(
      'user-id',
      106,
    );
    expect(result.changes).toEqual([]);
    expect(result.cursor).toBe(106);
  });

  it('returns changes and updates cursor', async () => {
    const mockChanges = [
      {
        id: BigInt(107),
        userId: 'user-id',
        sequence: 107,
        changeId: 'change-1',
        entity: 'user_book',
        entityId: 'abc',
        operation: 'upsert',
        payload: { currentPage: 90 },
        createdAt: new Date(),
      },
      {
        id: BigInt(108),
        userId: 'user-id',
        sequence: 108,
        changeId: 'change-2',
        entity: 'user',
        entityId: '123',
        operation: 'upsert',
        payload: { name: 'Juan' },
        createdAt: new Date(),
      },
    ];

    repository.findChangesAfterCursor.mockResolvedValue(mockChanges);

    const result = await handler.execute(new PullSyncQuery('user-id', 106));

    expect(result.changes).toHaveLength(2);
    expect(result.changes[0]).toMatchObject({
      sequence: 107,
      entity: 'user_book',
      entityId: 'abc',
      operation: 'upsert',
      data: { currentPage: 90 },
    });
    expect(result.changes[1]).toMatchObject({
      sequence: 108,
      entity: 'user',
      entityId: '123',
      operation: 'upsert',
      data: { name: 'Juan' },
    });
    expect(result.cursor).toBe(108);
  });
});
