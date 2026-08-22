import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserBook } from '../domain/user-book';

export class UserBookResponseDto {
  @ApiProperty({ example: 'b3f2c9a1-...' })
  id!: string;

  @ApiProperty({ example: 'a1b2c3d4-...' })
  userId!: string;

  @ApiProperty({ example: 'e5f6g7h8-...' })
  bookId!: string;

  @ApiProperty({ example: 80 })
  currentPage!: number;

  @ApiPropertyOptional({ example: '2026-08-21T20:00:00.000Z' })
  lastReadAt!: Date | null;

  @ApiProperty({ example: 7 })
  version!: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: Date;

  public static fromDomain(userBook: UserBook): UserBookResponseDto {
    const dto = new UserBookResponseDto();
    dto.id = userBook.id;
    dto.userId = userBook.userId;
    dto.bookId = userBook.bookId;
    dto.currentPage = userBook.currentPage;
    dto.lastReadAt = userBook.lastReadAt;
    dto.version = userBook.version;
    dto.createdAt = userBook.createdAt;
    dto.updatedAt = userBook.updatedAt;
    return dto;
  }
}
