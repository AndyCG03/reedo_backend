# Authentication Implementation Guide

This guide explains the internal implementation of the Reedo authentication system, including guards, decorators, services, and how the components work together.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [Core Components](#core-components)
- [Authentication Flow](#authentication-flow)
- [Guards and Decorators](#guards-and-decorators)
- [Token Management](#token-management)
- [Security Measures](#security-measures)
- [File Structure](#file-structure)
- [Extending the System](#extending-the-system)

## Architecture Overview

The authentication system follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Controllers Layer                        │
│  (AuthController - handles HTTP requests/responses)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Services Layer                          │
│  (AuthService - business logic for auth operations)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Repositories Layer                         │
│  (UserRepository, RefreshTokenRepository - data access)     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     Database Layer                           │
│  (Prisma ORM - database operations)                          │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Separation of Concerns:** Each layer has a single responsibility
2. **Dependency Injection:** Components are injected via NestJS DI
3. **Interface-Based Design:** Repositories use interfaces for testability
4. **Security-First:** All sensitive operations use Argon2 hashing
5. **Token Rotation:** Refresh tokens are rotated on every use

## Database Schema

### User Model

Located in `prisma/models/user.prisma`:

```prisma
model User {
  id           String   @id @db.Uuid
  username     String   @unique @db.VarChar(30)
  email        String?  @db.VarChar(320)
  bio          String?  @db.VarChar(280)
  avatarUrl    String?  @map("avatar_url") @db.VarChar(500)
  passwordHash String?  @map("password_hash") @db.VarChar(255)
  role         UserRole @default(USER)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  refreshTokens RefreshToken[]

  @@map("users")
}

enum UserRole {
  USER
  ADMIN
}
```

**Key Fields:**
- `passwordHash`: Argon2-hashed password (never exposed)
- `role`: User role for authorization (USER or ADMIN)
- `email`: Optional email for login

### RefreshToken Model

Located in `prisma/models/refresh-token.prisma`:

```prisma
model RefreshToken {
  id        String    @id @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  tokenHash String    @map("token_hash") @db.VarChar(255)
  expiresAt DateTime  @map("expires_at")
  createdAt DateTime  @default(now()) @map("created_at")
  revokedAt DateTime? @map("revoked_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenHash])
  @@map("refresh_tokens")
}
```

**Key Fields:**
- `tokenHash`: Argon2 hash of the token secret
- `expiresAt`: Token expiration time
- `revokedAt`: Null if active, set when revoked
- `userId`: Foreign key to User (cascade delete)

## Core Components

### AuthService

Located in `src/modules/auth/auth.service.ts`

The `AuthService` is the core business logic component for authentication.

**Key Methods:**

#### `register(dto: RegisterDto)`
- Validates user input
- Checks for duplicate username/email
- Hashes password using Argon2
- Creates user with USER role
- Issues initial access and refresh tokens

#### `login(dto: LoginDto)`
- Finds user by email
- Verifies password using Argon2
- Issues new access and refresh tokens
- Returns tokens to client

#### `refresh(rawToken: string)`
- Parses refresh token format (`uuid.secret`)
- Finds session by ID
- Verifies token hash using Argon2
- Revokes old token (rotation)
- Issues new tokens
- Returns new tokens to client

#### `logout(rawToken: string)`
- Parses refresh token format
- Finds session by ID
- Revokes the session
- No response (204 No Content)

#### `validateUser(payload: JwtPayload)`
- Called by JwtStrategy
- Finds user by ID from JWT payload
- Returns user if found, null otherwise

#### `issueTokens(userId: string)`
- Generates new JWT access token
- Creates new refresh token session
- Returns both tokens

**Token Generation:**

```typescript
private async buildRefreshToken(userId: string): Promise<{
  rawToken: string;
  session: RefreshToken;
}> {
  const sessionId = randomUUID();
  const secret = randomBytes(32).toString('hex');
  const rawToken = `${sessionId}.${secret}`;
  const tokenHash = await argon2.hash(secret);
  
  const session = RefreshToken.create({
    id: sessionId,
    userId,
    tokenHash,
    expiresAt: parseExpiresIn('30d'),
  });

  return { rawToken, session };
}
```

### AuthController

Located in `src/modules/auth/auth.controller.ts`

The `AuthController` handles HTTP requests and delegates to `AuthService`.

**Endpoints:**

```typescript
@Post('register')
async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
  return this.authService.register(dto);
}

@Post('login')
async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
  return this.authService.login(dto);
}

@Post('refresh')
async refresh(@Body() dto: RefreshDto): Promise<AuthResponseDto> {
  return this.authService.refresh(dto.refreshToken);
}

@Post('logout')
async logout(@Body() dto: LogoutDto): Promise<void> {
  return this.authService.logout(dto.refreshToken);
}
```

**Protected Endpoint:**

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getMe(@CurrentUser() user: User): Promise<UserResponseDto> {
  return UserResponseDto.fromEntity(user);
}
```

## Authentication Flow

### Registration Flow

```
Client Request
    ↓
AuthController.register()
    ↓
AuthService.register()
    ↓
UserRepository.findByEmail() - check duplicates
    ↓
argon2.hash() - hash password
    ↓
UserRepository.create() - create user
    ↓
AuthService.issueTokens() - generate tokens
    ↓
Return tokens to client
```

### Login Flow

```
Client Request
    ↓
AuthController.login()
    ↓
AuthService.login()
    ↓
UserRepository.findByEmail() - find user
    ↓
argon2.verify() - verify password
    ↓
AuthService.issueTokens() - generate tokens
    ↓
Return tokens to client
```

### Token Refresh Flow

```
Client Request (with refreshToken)
    ↓
AuthController.refresh()
    ↓
AuthService.refresh()
    ↓
Parse token: uuid.secret
    ↓
RefreshTokenRepository.findById(uuid) - find session
    ↓
Check session.isValid (not expired, not revoked)
    ↓
argon2.verify(session.tokenHash, secret) - verify token
    ↓
RefreshTokenRepository.revokeById() - revoke old token
    ↓
AuthService.issueTokens() - generate new tokens
    ↓
Return new tokens to client
```

### Protected Endpoint Flow

```
Client Request (with accessToken)
    ↓
JwtAuthGuard (Passport)
    ↓
JwtStrategy.validate()
    ↓
AuthService.validateUser()
    ↓
UserRepository.findById() - find user
    ↓
Set request.user = user
    ↓
Controller method executes
    ↓
@CurrentUser() decorator extracts user
    ↓
Return response
```

## Guards and Decorators

### JwtAuthGuard

Located in `src/modules/auth/guards/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Purpose:** Protects routes by requiring a valid JWT access token.

**How It Works:**
1. Extends Passport's `AuthGuard` with 'jwt' strategy
2. Automatically extracts token from `Authorization: Bearer <token>` header
3. Validates token using JwtStrategy
4. Sets `request.user` with validated user
5. Returns 401 if token is invalid or missing

**Usage:**

```typescript
@UseGuards(JwtAuthGuard)
@Get('me')
async getMe(@CurrentUser() user: User) {
  return user;
}
```

### RolesGuard

Located in `src/modules/auth/guards/roles.guard.ts`

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
```

**Purpose:** Protects routes by requiring specific user roles.

**How It Works:**
1. Retrieves required roles from metadata (set by @Roles decorator)
2. Extracts user from request (set by JwtAuthGuard)
3. Checks if user's role matches required roles
4. Returns true if authorized, false otherwise

**Usage:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Delete('users/:id')
async deleteUser(@Param('id') id: string) {
  // Only admins can delete users
}
```

### @CurrentUser Decorator

Located in `src/modules/auth/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Purpose:** Extracts the authenticated user from the request.

**How It Works:**
1. Creates a parameter decorator
2. Extracts `request.user` (set by JwtAuthGuard)
3. Returns the user to the controller method

**Usage:**

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getMe(@CurrentUser() user: User) {
  return user;
}
```

### @Roles Decorator

Located in `src/modules/auth/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

**Purpose:** Sets required roles metadata for route handlers.

**How It Works:**
1. Creates a decorator using `SetMetadata`
2. Stores roles in metadata with key `ROLES_KEY`
3. RolesGuard reads this metadata to enforce authorization

**Usage:**

```typescript
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Post('admin-only')
async adminAction() {
  // Only accessible by ADMIN role
}
```

## Token Management

### JWT Access Token

**Format:** Standard JWT with HS256 signing

**Payload:**
```typescript
{
  sub: string;      // User ID
  type: "access";   // Token type
  iat: number;      // Issued at (timestamp)
  exp: number;      // Expiration (timestamp)
}
```

**Generation:**
```typescript
private generateAccessToken(userId: string): string {
  const payload: JwtPayload = {
    sub: userId,
    type: 'access',
  };

  return this.jwtService.sign(payload);
}
```

**Validation:**
- Handled by Passport JWT Strategy
- Verifies signature using JWT_SECRET
- Checks expiration automatically
- Extracts user ID from `sub` claim

### Refresh Token

**Format:** `uuid.secret` (two parts separated by dot)

**Structure:**
- `uuid`: Session ID (references RefreshToken.id)
- `secret`: 32-byte random hex string

**Generation:**
```typescript
const sessionId = randomUUID();
const secret = randomBytes(32).toString('hex');
const rawToken = `${sessionId}.${secret}`;
const tokenHash = await argon2.hash(secret);
```

**Storage:**
- `sessionId`: Stored as RefreshToken.id
- `tokenHash`: Argon2 hash of secret stored in RefreshToken.tokenHash

**Validation:**
```typescript
const parts = rawToken.split('.');
const [sessionId, secret] = parts;

const session = await refreshTokenRepository.findById(sessionId);
const hashValid = await argon2.verify(session.tokenHash, secret);
```

**Rotation:**
- Old token is revoked on refresh
- New token with new secret is issued
- Prevents replay attacks

## Security Measures

### Password Hashing

**Algorithm:** Argon2 (Argon2id variant)

**Usage:**
```typescript
// Hashing
const passwordHash = await argon2.hash(password);

// Verification
const isValid = await argon2.verify(passwordHash, password);
```

**Why Argon2:**
- Memory-hard algorithm (resistant to GPU attacks)
- Winner of Password Hashing Competition
- Configurable parameters (time, memory, parallelism)

### Token Security

**Access Token:**
- Short-lived (15 minutes)
- Signed with JWT_SECRET
- No sensitive data in payload
- Stateless (no server storage)

**Refresh Token:**
- Long-lived (30 days)
- Stored as hash in database
- Random secret (32 bytes)
- Rotated on every use
- Can be revoked

### Session Management

**Multiple Sessions:**
- Users can have multiple active sessions
- Each login creates a new refresh token
- Logout only affects the specific session

**Revocation:**
- Immediate revocation on logout
- Automatic expiration after 30 days
- Cascade delete when user is deleted

### Transport Security

**Development:**
- HTTP allowed for local testing

**Production:**
- HTTPS required
- Secure cookies recommended
- HSTS headers recommended

## File Structure

```
src/modules/auth/
├── auth.controller.ts              # HTTP request handlers
├── auth.service.ts                # Business logic
├── auth.module.ts                 # Module configuration
├── dto/                           # Data Transfer Objects
│   ├── auth-response.dto.ts
│   └── features/
│       ├── register/
│       │   └── register.dto.ts
│       ├── login/
│       │   └── login.dto.ts
│       ├── refresh/
│       │   └── refresh.dto.ts
│       └── logout/
│           └── logout.dto.ts
├── guards/                        # Route protection
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── decorators/                    # Custom decorators
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts
├── strategies/                    # Passport strategies
│   └── jwt.strategy.ts
├── domain/                        # Domain models
│   ├── refresh-token.ts
│   └── refresh-token.repository.ts
└── infrastructure/
    └── persistence/
        └── prisma/
            └── prisma-refresh-token.repository.ts

src/modules/users/
├── domain/
│   ├── user.ts
│   └── user.repository.ts
└── infrastructure/
    └── persistence/
        └── prisma/
            └── prisma-user.repository.ts

src/database/seeders/
└── admin.seeder.ts                # Admin user seeder

prisma/models/
├── user.prisma                    # User schema
└── refresh-token.prisma           # RefreshToken schema
```

## Extending the System

### Adding New Roles

1. Update the UserRole enum in `prisma/models/user.prisma`:

```prisma
enum UserRole {
  USER
  ADMIN
  MODERATOR  // New role
}
```

2. Run migration:
```bash
npx prisma migrate dev --name add_moderator_role
```

3. Use the new role in guards:
```typescript
@Roles('ADMIN', 'MODERATOR')
@UseGuards(JwtAuthGuard, RolesGuard)
@Post('moderate')
async moderateContent() {
  // Accessible by ADMIN and MODERATOR
}
```

### Adding Custom Claims to JWT

1. Update the JwtPayload interface in `auth.service.ts`:

```typescript
export interface JwtPayload {
  sub: string;
  type: 'access';
  customClaim?: string;  // New claim
}
```

2. Update token generation:

```typescript
private generateAccessToken(userId: string, customClaim?: string): string {
  const payload: JwtPayload = {
    sub: userId,
    type: 'access',
    customClaim,  // Include custom claim
  };

  return this.jwtService.sign(payload);
}
```

3. Access the claim in JwtStrategy:

```typescript
async validate(payload: JwtPayload) {
  const user = await this.authService.validateUser(payload);
  if (payload.customClaim) {
    // Use custom claim
  }
  return user;
}
```

### Adding Two-Factor Authentication

1. Create a new field in User model:

```prisma
model User {
  // ... existing fields
  twoFactorSecret String? @map("two_factor_secret")
  twoFactorEnabled Boolean @default(false) @map("two_factor_enabled")
}
```

2. Create a new DTO for 2FA:

```typescript
export class TwoFactorDto {
  @IsString()
  code: string;
}
```

3. Add a new endpoint in AuthController:

```typescript
@Post('verify-2fa')
async verifyTwoFactor(@Body() dto: TwoFactorDto) {
  // Verify 2FA code
}
```

4. Update the login flow to require 2FA if enabled.

### Adding OAuth Providers

1. Install required packages:
```bash
npm install @nestjs/passport passport passport-google-oauth20
```

2. Create a new strategy:

```typescript
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/callback',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    // Validate and create/update user
  }
}
```

3. Add OAuth endpoints in AuthController:

```typescript
@Get('google')
@UseGuards(AuthGuard('google'))
async googleAuth() {
  // Initiates Google OAuth flow
}

@Get('google/callback')
@UseGuards(AuthGuard('google'))
async googleAuthCallback(@Req() req) {
  // Handles Google OAuth callback
}
```

## Testing

### Unit Tests

Located in `tests/auth/`:

- `auth.service.test.ts` - Tests for AuthService methods
- `jwt.strategy.test.ts` - Tests for JWT validation
- `roles.guard.test.ts` - Tests for role-based authorization
- `refresh-token.repository.test.ts` - Tests for repository operations
- `admin.seeder.test.ts` - Tests for admin seeder

### Integration Tests

- `auth.endpoint.test.ts` - Tests for HTTP endpoints

### Running Tests

```bash
# Run all auth tests
npm test -- tests/auth

# Run specific test file
npm test -- tests/auth/auth.service.test.ts
```

## Performance Considerations

### Database Indexes

The RefreshToken model has indexes on:
- `userId` - Fast lookup of user's sessions
- `tokenHash` - Fast token validation

### Token Validation

- Access tokens are stateless (no DB lookup)
- Refresh tokens require DB lookup (justified by security)
- Argon2 is computationally expensive (intentional for security)

### Caching

Consider caching:
- User data (short TTL)
- Role assignments (medium TTL)
- Session validity (short TTL)

## Monitoring and Logging

### Key Metrics to Monitor

- Failed login attempts (detect brute force)
- Token refresh frequency (detect anomalies)
- Session duration (detect long-lived sessions)
- Revoked sessions (detect security issues)

### Logging Points

- Successful logins
- Failed authentication attempts
- Token refresh operations
- Session revocations
- Role-based access denials

## Troubleshooting Implementation Issues

### Token Not Validating

1. Check JWT_SECRET matches between generation and validation
2. Verify token hasn't expired
3. Ensure token format is correct

### Refresh Token Rotation Not Working

1. Check that old token is being revoked
2. Verify new token has different secret
3. Ensure session ID is being updated

### Guard Not Protecting Route

1. Verify guard is applied with @UseGuards
2. Check guard order (JwtAuthGuard before RolesGuard)
3. Ensure @CurrentUser decorator is used correctly

### Role Check Failing

1. Verify user has correct role in database
2. Check @Roles decorator has correct role names
3. Ensure RolesGuard is applied after JwtAuthGuard

## Next Steps

- See [USAGE.md](./USAGE.md) for how to use the auth system
- See [FLUTTER_INTEGRATION.md](./FLUTTER_INTEGRATION.md) for Flutter client integration
