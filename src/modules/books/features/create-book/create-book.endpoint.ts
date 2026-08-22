import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookResponseDto } from '../../dto/book.response.dto';
import { CreateBookCommand } from './create-book.command';
import { CreateBookDto } from './create-book.dto';

@ApiTags('books')
@Controller('books')
export class CreateBookEndpoint {
  public constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a book' })
  @ApiCreatedResponse({ description: 'Book created', type: BookResponseDto })
  public create(@Body() dto: CreateBookDto): Promise<BookResponseDto> {
    return this.commandBus.execute(
      new CreateBookCommand(dto.title, dto.totalPages),
    );
  }
}
