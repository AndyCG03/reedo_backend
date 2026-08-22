import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserBookResponseDto } from '../../dto/user-book.response.dto';
import { GetUserBookQuery } from './get-user-book.query';

@ApiTags('user-books')
@Controller('users/:userId/books')
export class GetUserBookEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get(':bookId')
  @ApiOperation({ summary: 'Get a user book by user id and book id' })
  @ApiOkResponse({ description: 'User book found', type: UserBookResponseDto })
  @ApiNotFoundResponse({ description: 'User book does not exist' })
  public getUserBook(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('bookId', ParseUUIDPipe) bookId: string,
  ): Promise<UserBookResponseDto> {
    return this.queryBus.execute(new GetUserBookQuery(userId, bookId));
  }
}
