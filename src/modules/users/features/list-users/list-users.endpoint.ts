import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  Paginate,
  type PaginateQuery,
} from '@nestarc/pagination';
import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { UserResponseDto } from '../../dto/user.response.dto';
import { ListUsersQuery } from './list-users.query';

/**
 * HTTP endpoint (GET /users) for the list-users feature.
 *
 * The @Paginate() decorator parses page/limit/sortBy/search/filter.* query
 * parameters into a PaginateQuery object that is forwarded to the handler.
 *
 * @ApiPaginatedResponse (from @nestarc/pagination) auto-documents the
 * paginated envelope and its filter/sort/search query capabilities in the
 * OpenAPI document rendered by Scalar.
 */
@ApiTags('users')
@Controller('users')
export class ListUsersEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'List users (pagination, filtering, sorting)' })
  @ApiPaginatedResponse(UserResponseDto, {
    sortableColumns: ['id', 'username', 'email', 'createdAt', 'updatedAt'],
    searchableColumns: ['username', 'email'],
    filterableColumns: {
      username: ['$eq', '$ne', '$ilike', '$in', '$nin'],
      email: ['$eq', '$ne', '$ilike', '$in', '$nin', '$null', '$not:null'],
      bio: ['$eq', '$ne', '$ilike', '$null', '$not:null'],
      createdAt: ['$gt', '$gte', '$lt', '$lte', '$btw', '$null', '$not:null'],
      updatedAt: ['$gt', '$gte', '$lt', '$lte', '$btw', '$null', '$not:null'],
    },
  })
  public listUsers(@Paginate() query: PaginateQuery) {
    return this.queryBus.execute(new ListUsersQuery(query));
  }
}
