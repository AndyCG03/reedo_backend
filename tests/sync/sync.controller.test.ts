import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SyncController } from '../../src/modules/sync/sync.controller';
import { PullSyncQuery } from '../../src/modules/sync/features/pull-sync/pull-sync.query';
import { PushSyncCommand } from '../../src/modules/sync/features/push-sync/push-sync.command';
import { Request } from 'express';

describe('SyncController', () => {
  let controller: SyncController;
  let queryBus: { execute: jest.Mock };
  let commandBus: { execute: jest.Mock };

  beforeEach(async () => {
    queryBus = { execute: jest.fn() };
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        { provide: QueryBus, useValue: queryBus },
        { provide: CommandBus, useValue: commandBus },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
  });

  it('dispatches a PullSyncQuery with the correct userId and cursor', async () => {
    const expectedResponse = {
      changes: [],
      cursor: 106,
    };

    queryBus.execute.mockResolvedValue(expectedResponse);

    const mockReq = { userId: 'user-id' } as unknown as Request;
    const result = await controller.pull(mockReq, '106');

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(PullSyncQuery));
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-id', cursor: 106 }),
    );
    expect(result).toEqual(expectedResponse);
  });

  it('dispatches a PushSyncCommand with the correct userId and changes', async () => {
    const expectedResponse = {
      results: [],
      conflicts: [],
      cursor: 106,
    };

    commandBus.execute.mockResolvedValue(expectedResponse);

    const mockReq = { userId: 'user-id' } as unknown as Request;
    const dto = {
      changes: [
        {
          changeId: 'uuid-1',
          entity: 'user_book',
          entityId: 'abc',
          operation: 'upsert' as const,
          baseVersion: 4,
          data: { currentPage: 80 },
        },
      ],
    };

    const result = await controller.push(mockReq, dto);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(PushSyncCommand),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-id', changes: dto.changes }),
    );
    expect(result).toEqual(expectedResponse);
  });
});
