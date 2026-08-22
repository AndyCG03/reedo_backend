import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SyncChange } from '../domain/sync-change';

export class SyncChangeDto {
  @ApiProperty({ example: 107 })
  sequence!: number;

  @ApiProperty({ example: 'user_book' })
  entity!: string;

  @ApiProperty({ example: 'abc-123-...' })
  entityId!: string;

  @ApiProperty({ example: 'upsert' })
  operation!: string;

  @ApiPropertyOptional({ example: 8 })
  version?: number;

  @ApiProperty({
    example: { currentPage: 80, lastReadAt: '2026-08-21T20:00:00Z' },
  })
  data!: Record<string, unknown>;

  public static fromDomain(syncChange: SyncChange): SyncChangeDto {
    const dto = new SyncChangeDto();
    dto.sequence = syncChange.sequence;
    dto.entity = syncChange.entity;
    dto.entityId = syncChange.entityId;
    dto.operation = syncChange.operation;
    dto.data = syncChange.payload;
    return dto;
  }
}
