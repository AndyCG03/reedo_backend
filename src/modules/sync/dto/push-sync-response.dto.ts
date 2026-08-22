import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PushResultItemDto {
  @ApiProperty({ example: 'uuid-1' })
  changeId!: string;

  @ApiProperty({
    example: 'accepted',
    enum: ['accepted', 'conflict', 'duplicate'],
  })
  status!: 'accepted' | 'conflict' | 'duplicate';

  @ApiPropertyOptional({ example: 'abc-123-...' })
  entityId?: string;

  @ApiPropertyOptional({ example: 7 })
  version?: number;

  @ApiPropertyOptional({ example: 8 })
  serverVersion?: number;

  @ApiPropertyOptional({ example: { currentPage: 85 } })
  serverData?: Record<string, unknown>;
}

export class PushSyncResponseDto {
  @ApiProperty({ type: [PushResultItemDto] })
  results!: PushResultItemDto[];

  @ApiProperty({ type: [PushResultItemDto] })
  conflicts!: PushResultItemDto[];

  @ApiProperty({ example: 108 })
  cursor!: number;
}
