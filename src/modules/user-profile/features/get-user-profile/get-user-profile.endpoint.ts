import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserProfileResponseDto } from '../../dto/user-profile.response.dto';
import { GetUserProfileQuery } from './get-user-profile.query';

/**
 * HTTP endpoint (GET /user-profile/:id) for the get-user-profile feature.
 *
 * It is intentionally thin: it maps the route to a query and leaves all logic
 * to the query handler.
 */
@ApiTags('user-profile')
@Controller('user-profile')
export class GetUserProfileEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a user profile by id' })
  @ApiOkResponse({
    description: 'Profile found',
    type: UserProfileResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Profile does not exist' })
  public getProfile(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserProfileResponseDto> {
    return this.queryBus.execute(new GetUserProfileQuery(id));
  }
}
