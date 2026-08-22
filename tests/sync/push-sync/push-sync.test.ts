import { SyncChangeRepository } from '../../../src/modules/sync/domain/sync-change.repository';
import { PushSyncHandler } from '../../../src/modules/sync/features/push-sync/push-sync.handler';
import { PushSyncCommand } from '../../../src/modules/sync/features/push-sync/push-sync.command';

describe('PushSyncHandler', () => {
  let handler: PushSyncHandler;
  let repository: jest.Mocked<SyncChangeRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findChangesAfterCursor: jest.fn(),
      getNextSequence: jest.fn(),
      existsByChangeId: jest.fn(),
      findById: jest.fn(),
    };
    handler = new PushSyncHandler(repository);
  });

  it('processes changes and returns accepted status', async () => {
    repository.existsByChangeId.mockResolvedValue(false);
    repository.getNextSequence.mockResolvedValue(107);
    repository.create.mockImplementation((change) => Promise.resolve(change));

    const changes = [
      {
        changeId: 'uuid-1',
        entity: 'user_book',
        entityId: 'abc',
        operation: 'upsert' as const,
        baseVersion: 4,
        data: { currentPage: 80, lastReadAt: '2026-08-21T20:00:00Z' },
      },
    ];

    const result = await handler.execute(
      new PushSyncCommand('user-id', changes),
    );

    expect(repository.existsByChangeId).toHaveBeenCalledWith(
      'user-id',
      'uuid-1',
    );
    expect(repository.getNextSequence).toHaveBeenCalledWith('user-id');
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      changeId: 'uuid-1',
      status: 'accepted',
      entityId: 'abc',
      version: 5,
    });
    expect(result.conflicts).toEqual([]);
    expect(result.cursor).toBe(107);
  });

  it('handles duplicate changes gracefully', async () => {
    repository.existsByChangeId.mockResolvedValue(true);
    repository.getNextSequence.mockResolvedValue(107);

    const changes = [
      {
        changeId: 'uuid-1',
        entity: 'user_book',
        entityId: 'abc',
        operation: 'upsert' as const,
        baseVersion: 4,
        data: { currentPage: 80 },
      },
    ];

    const result = await handler.execute(
      new PushSyncCommand('user-id', changes),
    );

    expect(repository.existsByChangeId).toHaveBeenCalledWith(
      'user-id',
      'uuid-1',
    );
    expect(repository.create).not.toHaveBeenCalled();
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      changeId: 'uuid-1',
      status: 'duplicate',
    });
  });

  it('processes multiple changes with correct sequences', async () => {
    repository.existsByChangeId.mockResolvedValue(false);
    repository.getNextSequence
      .mockResolvedValueOnce(107)
      .mockResolvedValueOnce(108);
    repository.create.mockImplementation((change) => Promise.resolve(change));

    const changes = [
      {
        changeId: 'uuid-1',
        entity: 'user_book',
        entityId: 'abc',
        operation: 'upsert' as const,
        baseVersion: 4,
        data: { currentPage: 80 },
      },
      {
        changeId: 'uuid-2',
        entity: 'user',
        entityId: '123',
        operation: 'upsert' as const,
        baseVersion: 3,
        data: { name: 'Juan' },
      },
    ];

    const result = await handler.execute(
      new PushSyncCommand('user-id', changes),
    );

    expect(repository.create).toHaveBeenCalledTimes(2);
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toMatchObject({
      changeId: 'uuid-1',
      status: 'accepted',
      version: 5,
    });
    expect(result.results[1]).toMatchObject({
      changeId: 'uuid-2',
      status: 'accepted',
      version: 4,
    });
    expect(result.cursor).toBe(108);
  });

  it('returns current cursor when no changes are provided', async () => {
    repository.getNextSequence.mockResolvedValue(107);

    const result = await handler.execute(new PushSyncCommand('user-id', []));

    expect(result.results).toEqual([]);
    expect(result.cursor).toBe(106);
  });
});
