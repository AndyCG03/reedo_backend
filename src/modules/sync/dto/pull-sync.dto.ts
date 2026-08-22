import { ApiProperty } from '@nestjs/swagger';
import { SyncChangeDto } from './sync-change.dto';

export class PullSyncResponseDto {
  @ApiProperty({ type: [SyncChangeDto] })
  changes!: SyncChangeDto[];

  @ApiProperty({ example: 108 })
  cursor!: number;
}
