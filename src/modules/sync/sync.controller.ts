import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PullSyncResponseDto } from './dto/pull-sync.dto';
import { PushSyncResponseDto } from './dto/push-sync-response.dto';
import { PullSyncQuery } from './features/pull-sync/pull-sync.query';
import { PushSyncCommand } from './features/push-sync/push-sync.command';
import { PushSyncDto } from './dto/push-sync.dto';

interface AuthenticatedRequest {
  userId?: string;
}

@ApiTags('sync')
@Controller('sync')
export class SyncController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Pull sync changes from server' })
  @ApiQuery({ name: 'cursor', required: true, type: Number })
  @ApiOkResponse({
    description: 'Changes retrieved successfully',
    type: PullSyncResponseDto,
  })
  public pull(
    @Req() req: AuthenticatedRequest,
    @Query('cursor') cursor: string,
  ): Promise<PullSyncResponseDto> {
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';
    return this.queryBus.execute(
      new PullSyncQuery(userId, parseInt(cursor, 10) || 0),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Push sync changes to server' })
  @ApiOkResponse({
    description: 'Changes processed successfully',
    type: PushSyncResponseDto,
  })
  public push(
    @Req() req: AuthenticatedRequest,
    @Body() dto: PushSyncDto,
  ): Promise<PushSyncResponseDto> {
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';
    return this.commandBus.execute(new PushSyncCommand(userId, dto.changes));
  }
}
