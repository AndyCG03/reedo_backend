import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Input payload for the create-user-profile feature (POST /user-profile).
 *
 * class-validator rules are enforced by the global ValidationPipe, and the
 * Swagger decorators feed the OpenAPI document rendered by Scalar.
 */
export class CreateUserProfileDto {
  @ApiProperty({
    description: 'Unique username used to identify the profile',
    example: 'bookworm',
    minLength: 3,
    maxLength: 30,
  })
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message:
      'username can only contain letters, numbers, dots, dashes and underscores',
  })
  username!: string;

  @ApiProperty({
    description: 'Human readable name shown in the UI',
    example: 'Bookworm',
    minLength: 1,
    maxLength: 60,
  })
  @IsString()
  @Length(1, 60)
  displayName!: string;

  @ApiPropertyOptional({
    description: 'Short bio shown on the profile',
    example: 'Avid reader of sci-fi and fantasy.',
    maxLength: 280,
  })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @ApiPropertyOptional({
    description: 'URL of the profile picture',
    example: 'https://res.cloudinary.com/example/avatar.png',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
