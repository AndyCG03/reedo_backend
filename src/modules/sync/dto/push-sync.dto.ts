import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsString,
  IsUUID,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PushChangeDto {
  @ApiProperty({ example: 'uuid-1' })
  @IsString()
  @IsUUID()
  changeId!: string;

  @ApiProperty({ example: 'user_book' })
  @IsString()
  entity!: string;

  @ApiProperty({ example: 'abc-123-...' })
  @IsString()
  @IsUUID()
  entityId!: string;

  @ApiProperty({ example: 'upsert', enum: ['upsert', 'delete'] })
  @IsEnum(['upsert', 'delete'])
  operation!: 'upsert' | 'delete';

  @ApiProperty({
    example: 4,
    description: 'Base version for conflict detection',
  })
  @IsInt()
  @Min(0)
  baseVersion!: number;

  @ApiProperty({
    example: { currentPage: 80, lastReadAt: '2026-08-21T20:00:00Z' },
  })
  @IsObject()
  data!: Record<string, unknown>;
}

export class PushSyncDto {
  @ApiProperty({ type: [PushChangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PushChangeDto)
  changes!: PushChangeDto[];
}
