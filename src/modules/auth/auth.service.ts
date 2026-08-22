import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID, randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { User } from '../users/domain/user';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../users/domain/user.repository';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from './domain/refresh-token.repository';
import { RefreshToken } from './domain/refresh-token';
import { AuthResponseDto } from './dto/auth-response.dto';

export interface JwtPayload {
  sub: string;
  type: 'access';
}

/**
 * Core authentication service.
 *
 * Handles registration, credential validation, token issuance/rotation, and
 * session revocation. All token logic is centralised here so handlers stay
 * thin.
 */
@Injectable()
export class AuthService {
  public constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Registration ────────────────────────────────────────────────────────────

  public async register(input: {
    username: string;
    email: string;
    password: string;
    bio?: string | null;
    avatarUrl?: string | null;
  }): Promise<AuthResponseDto> {
    const [existingByEmail, existingByUsername] = await Promise.all([
      this.userRepository.findByEmail(input.email),
      this.userRepository.findByUsername(input.username),
    ]);

    if (existingByEmail) {
      throw new ConflictException('Email is already registered.');
    }
    if (existingByUsername) {
      throw new ConflictException(`Username "${input.username}" is already taken.`);
    }

    const passwordHash = await argon2.hash(input.password);

    const user = User.create({
      id: randomUUID(),
      username: input.username,
      email: input.email,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      passwordHash,
      role: 'USER',
    });

    await this.userRepository.create(user);
    return this.issueTokens(user.id);
  }

  // ── Login ────────────────────────────────────────────────────────────────────

  public async login(email: string, password: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(user.id);
  }

  // ── Refresh (rotation) ───────────────────────────────────────────────────────

  public async refresh(rawToken: string): Promise<AuthResponseDto> {
    const tokenHash = await argon2.hash(rawToken);

    // We need to scan by hash — find candidates for this user
    // Strategy: hash the incoming token and compare via findByHash
    // Since argon2 is not deterministic we store hash at creation and
    // must verify with argon2.verify. We fetch all non-revoked tokens
    // for matching via a lookup by raw scan is not feasible at scale, so
    // we store a SHA-256 hex digest for lookup and argon2 hash for security.
    // Re-reading the design: we use argon2 for the hash stored, and for
    // lookup we use a secondary fast index via SHA-256 prefix lookup.
    // Simplest correct approach: store argon2 hash AND a lookup token_hash
    // using SHA-256. But to keep it simple with one column, we verify
    // by fetching the record where the stored hash matches via argon2.verify.
    // We use findByHash with a SHA-256 fast lookup stored alongside.
    //
    // For simplicity in this implementation we use a two-column approach:
    // The tokenHash column stores a hex SHA-256 for fast lookup, and we
    // rely on the fact that the raw token is a 256-bit random value that
    // an attacker can't predict, so SHA-256 of it is safe for lookup.
    // The argon2 layer is the defense-in-depth at rest.
    //
    // Here we use SHA-256 for findByHash (fast indexed lookup) and
    // argon2 hash is stored as the actual DB value for breach resistance.
    // For this codebase we keep it simple: store argon2 hash, look up by it
    // using a full-table scan (acceptable for session counts per user).
    // At scale, add a separate SHA-256 lookup column.
    void tokenHash; // not used directly — see below

    // We must verify the token: fetch by scanning the user's tokens.
    // Since argon2 is non-deterministic we can't do an exact DB match.
    // Practical approach: include the session id in the refresh token
    // payload so we can look it up directly, then verify the hash.
    // The refresh token format: "<uuid>.<random>"
    const parts = rawToken.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    const [sessionId, secret] = parts;

    const session = await this.refreshTokenRepository.findById(sessionId);
    if (!session || !session.isValid) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    const hashValid = await argon2.verify(session.tokenHash, secret);
    if (!hashValid) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    // Rotation: revoke old session, issue new pair
    await this.refreshTokenRepository.revokeById(session.id);
    return this.issueTokens(session.userId);
  }

  // ── Logout ───────────────────────────────────────────────────────────────────

  public async logout(rawToken: string): Promise<void> {
    const parts = rawToken.split('.');
    if (parts.length !== 2) return; // silently ignore malformed tokens

    const [sessionId, secret] = parts;
    const session = await this.refreshTokenRepository.findById(sessionId);
    if (!session) return;

    const hashValid = await argon2.verify(session.tokenHash, secret);
    if (!hashValid) return;

    await this.refreshTokenRepository.revokeById(session.id);
  }

  // ── Validate JWT payload (used by JwtStrategy) ───────────────────────────────

  public async validatePayload(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return user;
  }

  // ── Token issuance ───────────────────────────────────────────────────────────

  private async issueTokens(userId: string): Promise<AuthResponseDto> {
    const accessToken = this.signAccessToken(userId);
    const { rawToken, session } = await this.buildRefreshToken(userId);

    await this.refreshTokenRepository.create(session);

    return { accessToken, refreshToken: rawToken };
  }

  private signAccessToken(userId: string): string {
    const payload: JwtPayload = { sub: userId, type: 'access' };
    return this.jwtService.sign(payload);
  }

  private async buildRefreshToken(userId: string): Promise<{
    rawToken: string;
    session: RefreshToken;
  }> {
    const sessionId = randomUUID();
    const secret = randomBytes(32).toString('hex');
    const rawToken = `${sessionId}.${secret}`;
    const tokenHash = await argon2.hash(secret);

    const expiresInRaw =
      this.config.get<string>('jwt.refreshExpiresIn') ?? '30d';
    const expiresAt = parseExpiresIn(expiresInRaw);

    const session = RefreshToken.create({
      id: sessionId,
      userId,
      tokenHash,
      expiresAt,
    });

    return { rawToken, session };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseExpiresIn(value: string): Date {
  const unit = value.slice(-1);
  const amount = parseInt(value.slice(0, -1), 10);
  const now = Date.now();

  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  const ms = (multipliers[unit] ?? 86_400_000) * amount;
  return new Date(now + ms);
}
