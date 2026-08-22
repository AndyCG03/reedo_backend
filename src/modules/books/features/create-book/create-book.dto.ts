import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Min } from 'class-validator';

export class CreateBookDto {
  @ApiProperty({ example: 'The Hobbit', minLength: 1, maxLength: 500 })
  @IsString()
  @Length(1, 500)
  title!: string;

  @ApiProperty({ example: 310, minimum: 1 })
  @IsInt()
  @Min(1)
  totalPages!: number;
}
