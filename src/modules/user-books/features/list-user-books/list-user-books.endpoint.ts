import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Sieve } from '../../../../common/sieve/sieve.decorator';
import type { SieveOptions } from '../../../../common/sieve/sieve-options';
import { ListUserBooksQuery } from './list-user-books.query';

@ApiTags('user-books')
@Controller('users/:userId/books')
export class ListUserBooksEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List user books (pagination, filtering, sorting)' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'filters', required: false, type: String })
  @ApiQuery({ name: 'sorts', required: false, type: String })
  public listUserBooks(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Sieve() query: SieveOptions,
  ) {
    return this.queryBus.execute(new ListUserBooksQuery(userId, query));
  }
}
