import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Sieve } from '../../../../common/sieve/sieve.decorator';
import type { SieveOptions } from '../../../../common/sieve/sieve-options';
import { ListPostsQuery } from './list-posts.query';

@ApiTags('posts')
@Controller('posts')
export class ListPostsEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List posts (pagination, filtering, sorting)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'filters', required: false, type: String })
  @ApiQuery({ name: 'sorts', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'bookId', required: false, type: String })
  public listPosts(
    @Sieve() query: SieveOptions,
    @Query('userId') userId?: string,
    @Query('bookId') bookId?: string,
  ) {
    return this.queryBus.execute(new ListPostsQuery(query, userId, bookId));
  }
}
