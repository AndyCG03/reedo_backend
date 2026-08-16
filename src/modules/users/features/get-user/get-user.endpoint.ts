import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDto } from '../../dto/user.response.dto';
import { GetUserQuery } from './get-user.query';

/**
 * HTTP endpoint (GET /users/:id) for the get-user feature.
 *
 * It is intentionally thin: it maps the route to a query and leaves all logic
 * to the query handler.
 */
@ApiTags('users')
@Controller('users')
export class GetUserEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiOkResponse({
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User does not exist' })
  public getUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.queryBus.execute(new GetUserQuery(id));
  }
}
