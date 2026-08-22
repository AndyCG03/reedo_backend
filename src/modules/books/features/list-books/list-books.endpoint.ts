import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Sieve } from '../../../../common/sieve/sieve.decorator';
import type { SieveOptions } from '../../../../common/sieve/sieve-options';
import { ListBooksQuery } from './list-books.query';

@ApiTags('books')
@Controller('books')
export class ListBooksEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List books (pagination, filtering, sorting)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'filters', required: false, type: String })
  @ApiQuery({ name: 'sorts', required: false, type: String })
  public listBooks(@Sieve() query: SieveOptions) {
    return this.queryBus.execute(new ListBooksQuery(query));
  }
}
