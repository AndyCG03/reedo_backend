import { ApiProperty } from '@nestjs/swagger';
import { User } from '../domain/user';

/**
 * Read model returned by the users features (GET, POST and list).
 *
 * It is shared across the features of this module, so it lives in the
 * module-level dto/ folder instead of inside a single feature.
 */
export class UserResponseDto {
  @ApiProperty({ description: 'User id (UUID)', example: 'b3f2c9a1-...' })
  id!: string;

  @ApiProperty({ description: 'Unique username', example: 'bookworm' })
  username!: string;

  @ApiProperty({
    description: 'Email',
    example: 'user@example.com',
    nullable: true,
  })
  email!: string | null;

  @ApiProperty({ description: 'Short bio', example: null, nullable: true })
  bio!: string | null;

  @ApiProperty({ description: 'Avatar URL', example: null, nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;

  public static fromDomain(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.username = user.username;
    dto.email = user.email;
    dto.bio = user.bio;
    dto.avatarUrl = user.avatarUrl;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
