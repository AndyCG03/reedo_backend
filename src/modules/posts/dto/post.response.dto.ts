import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Post } from '../domain/post';
import type { EnrichedPost } from '../domain/post.repository';

class AuthorDto {
  @ApiProperty({ example: 'b3f2c9a1-...' })
  id!: string;

  @ApiProperty({ example: 'bookworm' })
  username!: string;
}

class BookDto {
  @ApiProperty({ example: '456...' })
  id!: string;

  @ApiProperty({ example: 'La bella y la bestia' })
  title!: string;
}

export class PostResponseDto {
  @ApiProperty({ example: '123...' })
  id!: string;

  @ApiProperty({ example: 'Me encantó este libro' })
  content!: string;

  @ApiPropertyOptional({ type: BookDto })
  book!: BookDto | null;

  @ApiProperty({ type: AuthorDto })
  author!: AuthorDto;

  @ApiProperty({ example: 15 })
  likesCount!: number;

  @ApiProperty({ example: true })
  likedByMe!: boolean;

  @ApiProperty({ example: 4 })
  commentsCount!: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: Date;

  public static fromEnriched(enriched: EnrichedPost): PostResponseDto {
    const dto = new PostResponseDto();
    dto.id = enriched.post.id;
    dto.content = enriched.post.content;
    dto.book = enriched.book;
    dto.author = enriched.author;
    dto.likesCount = enriched.likesCount;
    dto.likedByMe = enriched.likedByUser;
    dto.commentsCount = enriched.commentsCount;
    dto.createdAt = enriched.post.createdAt;
    dto.updatedAt = enriched.post.updatedAt;
    return dto;
  }

  public static fromPost(post: Post): PostResponseDto {
    const dto = new PostResponseDto();
    dto.id = post.id;
    dto.content = post.content;
    dto.book = null;
    dto.author = { id: '', username: '' };
    dto.likesCount = 0;
    dto.likedByMe = false;
    dto.commentsCount = 0;
    dto.createdAt = post.createdAt;
    dto.updatedAt = post.updatedAt;
    return dto;
  }
}
