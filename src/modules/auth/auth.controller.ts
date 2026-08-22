import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './features/register/register.dto';
import { LoginDto } from './features/login/login.dto';
import { RefreshDto } from './features/refresh/refresh.dto';
import { LogoutDto } from './features/logout/logout.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/domain/user';
import { UserResponseDto } from '../users/dto/user.response.dto';

/**
 * Auth endpoints: register, login, refresh and logout.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user and receive tokens' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  public register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register({
      username: dto.username,
      email: dto.email,
      password: dto.password,
      bio: dto.bio,
      avatarUrl: dto.avatarUrl,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive tokens' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  public login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and receive new token pair' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh token invalid or expired' })
  public refresh(@Body() dto: RefreshDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current refresh token (logout)' })
  @ApiNoContentResponse({ description: 'Logged out' })
  public async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }
}

/**
 * GET /users/me — protected profile endpoint.
 *
 * Grouped under the "users" tag in Scalar, next to the other user endpoints.
 */
@ApiTags('users')
@Controller('users')
export class MeEndpoint {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  public me(@CurrentUser() user: User): UserResponseDto {
    return UserResponseDto.fromDomain(user);
  }
}
