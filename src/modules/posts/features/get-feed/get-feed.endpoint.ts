import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Req } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Sieve } from '../../../../common/sieve/sieve.decorator';
import type { SieveOptions } from '../../../../common/sieve/sieve-options';
import { GetFeedQuery } from './get-feed.query';

interface AuthenticatedRequest {
  userId?: string;
}

@ApiTags('feed')
@Controller('feed')
export class GetFeedEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Get the feed (posts ordered by creation date)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'filters', required: false, type: String })
  @ApiQuery({ name: 'sorts', required: false, type: String })
  public getFeed(
    @Req() req: AuthenticatedRequest,
    @Sieve() query: SieveOptions,
  ) {
    const userId = req.userId || '00000000-0000-0000-0000-000000000001';
    return this.queryBus.execute(new GetFeedQuery(query, userId));
  }
}
