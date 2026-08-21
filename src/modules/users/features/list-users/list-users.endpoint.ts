import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Sieve } from '../../../../common/sieve/sieve.decorator';
import type { SieveOptions } from '../../../../common/sieve/sieve-options';
import { ListUsersQuery } from './list-users.query';

/**
 * HTTP endpoint (GET /users) for the list-users feature.
 *
 * The @Sieve() decorator parses page/pageSize/filters/sorts query
 * parameters into a SieveOptions object that is forwarded to the handler.
 */
@ApiTags('users')
@Controller('users')
export class ListUsersEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List users (pagination, filtering, sorting)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    type: String,
    description: 'Filters shorthand, e.g. name==John,price>100',
  })
  @ApiQuery({
    name: 'sorts',
    required: false,
    type: String,
    description: 'Sort fields, e.g. createdAt:desc,name:asc',
  })
  public listUsers(@Sieve() query: SieveOptions) {
    return this.queryBus.execute(new ListUsersQuery(query));
  }
}
