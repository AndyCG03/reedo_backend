import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from '../domain/user-profile';

/**
 * Read model returned by the user profile features (GET and POST).
 *
 * It is shared across the features of this module, so it lives in the
 * module-level dto/ folder instead of inside a single feature.
 */
export class UserProfileResponseDto {
  @ApiProperty({ description: 'Profile id (UUID)', example: 'b3f2c9a1-...' })
  id!: string;

  @ApiProperty({ description: 'Unique username', example: 'bookworm' })
  username!: string;

  @ApiProperty({ description: 'Display name', example: 'Bookworm' })
  displayName!: string;

  @ApiProperty({ description: 'Short bio', example: null, nullable: true })
  bio!: string | null;

  @ApiProperty({
    description: 'Avatar URL',
    example: null,
    nullable: true,
  })
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

  public static fromDomain(profile: UserProfile): UserProfileResponseDto {
    const dto = new UserProfileResponseDto();
    dto.id = profile.id;
    dto.username = profile.username;
    dto.displayName = profile.displayName;
    dto.bio = profile.bio;
    dto.avatarUrl = profile.avatarUrl;
    dto.createdAt = profile.createdAt;
    dto.updatedAt = profile.updatedAt;
    return dto;
  }
}
