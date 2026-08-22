import { ApiProperty } from '@nestjs/swagger';
import { Comment } from '../domain/comment';
import type { CommentWithAuthor } from '../domain/comment.repository';

class CommentAuthorDto {
  @ApiProperty({ example: 'b3f2c9a1-...' })
  id!: string;

  @ApiProperty({ example: 'bookworm' })
  username!: string;
}

export class CommentResponseDto {
  @ApiProperty({ example: '123...' })
  id!: string;

  @ApiProperty({ example: 'Totalmente de acuerdo' })
  content!: string;

  @ApiProperty({ type: CommentAuthorDto })
  author!: CommentAuthorDto;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: Date;

  public static fromAuthorComment(
    enriched: CommentWithAuthor,
  ): CommentResponseDto {
    const dto = new CommentResponseDto();
    dto.id = enriched.comment.id;
    dto.content = enriched.comment.content;
    dto.author = enriched.author;
    dto.createdAt = enriched.comment.createdAt;
    dto.updatedAt = enriched.comment.updatedAt;
    return dto;
  }

  public static fromComment(comment: Comment): CommentResponseDto {
    const dto = new CommentResponseDto();
    dto.id = comment.id;
    dto.content = comment.content;
    dto.author = { id: '', username: '' };
    dto.createdAt = comment.createdAt;
    dto.updatedAt = comment.updatedAt;
    return dto;
  }
}
