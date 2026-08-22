import { ApiProperty } from '@nestjs/swagger';

/**
 * Response returned by /auth/register, /auth/login and /auth/refresh.
 */
export class AuthResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token (15 min)' })
  accessToken!: string;

  @ApiProperty({ description: 'Long-lived refresh token used to rotate sessions' })
  refreshToken!: string;
}
