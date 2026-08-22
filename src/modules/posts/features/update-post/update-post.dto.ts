import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @ApiProperty({
    description: 'Updated content of the post',
    example: 'Me encantó aún más este libro',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}
