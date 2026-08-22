import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: 'Content of the post',
    example: 'Me encantó este libro',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({
    description: 'Related book id',
    example: '456...',
  })
  @IsOptional()
  @IsUUID()
  bookId?: string;
}
