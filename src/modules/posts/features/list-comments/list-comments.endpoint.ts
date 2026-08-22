import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Sieve } from '../../../../common/sieve/sieve.decorator';
import type { SieveOptions } from '../../../../common/sieve/sieve-options';
import { ListCommentsQuery } from './list-comments.query';

@ApiTags('posts')
@Controller('posts')
export class ListCommentsEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments on a post' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'filters', required: false, type: String })
  @ApiQuery({ name: 'sorts', required: false, type: String })
  public listComments(
    @Param('id') postId: string,
    @Sieve() query: SieveOptions,
  ) {
    return this.queryBus.execute(new ListCommentsQuery(postId, query));
  }
}
