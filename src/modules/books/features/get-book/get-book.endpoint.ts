import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BookResponseDto } from '../../dto/book.response.dto';
import { GetBookQuery } from './get-book.query';

@ApiTags('books')
@Controller('books')
export class GetBookEndpoint {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by id' })
  @ApiOkResponse({ description: 'Book found', type: BookResponseDto })
  @ApiNotFoundResponse({ description: 'Book does not exist' })
  public getBook(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookResponseDto> {
    return this.queryBus.execute(new GetBookQuery(id));
  }
}
