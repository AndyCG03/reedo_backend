import { ApiProperty } from '@nestjs/swagger';
import { Book } from '../domain/book';

export class BookResponseDto {
  @ApiProperty({ example: 'b3f2c9a1-...' })
  id!: string;

  @ApiProperty({ example: 'The Hobbit' })
  title!: string;

  @ApiProperty({ example: 310 })
  totalPages!: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: Date;

  public static fromDomain(book: Book): BookResponseDto {
    const dto = new BookResponseDto();
    dto.id = book.id;
    dto.title = book.title;
    dto.totalPages = book.totalPages;
    dto.createdAt = book.createdAt;
    dto.updatedAt = book.updatedAt;
    return dto;
  }
}
