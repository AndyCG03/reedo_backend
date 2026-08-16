import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Input payload for the create-user feature (POST /users).
 *
 * class-validator rules are enforced by the global ValidationPipe, and the
 * Swagger decorators feed the OpenAPI document rendered by Scalar.
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Unique username used to identify the user',
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

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'bookworm@example.com',
    maxLength: 320,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

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
