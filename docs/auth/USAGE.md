# Authentication Usage Guide

This guide explains how to use the authentication system in the Reedo backend, including API testing with Scalar and the admin seeder.

## Table of Contents

- [Environment Configuration](#environment-configuration)
- [Admin Seeder](#admin-seeder)
- [API Endpoints](#api-endpoints)
- [Testing with Scalar](#testing-with-scalar)
- [Authentication Flow](#authentication-flow)
- [Common Use Cases](#common-use-cases)

## Environment Configuration

Before using the authentication system, ensure the following environment variables are configured in your `.env` file:

```env
# JWT Configuration
JWT_SECRET=super-secret-change-me
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# Admin Seeder Configuration
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Admin12345678!
ADMIN_USERNAME=admin
```

**Important:** Change `JWT_SECRET` in production environments.

## Admin Seeder

The admin seeder creates an initial administrator user for the application. This is useful for development, testing, and initial deployment.

### Running the Seeder

```bash
npm run seed:admin
```

### What It Does

- Checks if an admin user already exists (idempotent)
- If not exists, creates an admin user with:
  - `email`: admin@gmail.com
  - `password`: Admin12345678!
  - `username`: admin
  - `role`: ADMIN

### Idempotency

The seeder is idempotent - running it multiple times will not create duplicate admin users. It checks for existing admin users before creating a new one.

### When to Run

- **Development:** Run once to set up your local environment
- **Testing:** Run before test suites that require an admin user
- **Production:** Run once during initial deployment, then disable

### Security Notes

- The admin password is hashed using Argon2 before storage
- Do not use the default credentials in production
- Change the admin password immediately after first login in production

## API Endpoints

The authentication system provides the following endpoints:

### Register User

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "bio": "Optional bio text",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid.randomhexstring"
}
```

**Validation Rules:**
- `username`: 3-30 characters, alphanumeric and underscores
- `email`: Valid email format (optional)
- `password`: Minimum 8 characters, must include uppercase, lowercase, and number
- `bio`: Maximum 280 characters (optional)
- `avatarUrl`: Valid URL, max 500 characters (optional)

### Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid.randomhexstring"
}
```

**Notes:**
- Email is case-insensitive
- Returns 401 for invalid credentials
- Returns 404 if user not found

### Refresh Token

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "uuid.randomhexstring"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid.randomhexstring"
}
```

**Behavior:**
- Validates the refresh token
- Revokes the old refresh token (rotation)
- Issues new access and refresh tokens
- Returns 401 for invalid or expired tokens

### Logout

**Endpoint:** `POST /auth/logout`

**Request Body:**
```json
{
  "refreshToken": "uuid.randomhexstring"
}
```

**Response:** 204 No Content

**Behavior:**
- Revokes the specified refresh token
- Invalidates the session
- Client should clear stored tokens

### Get Current User

**Endpoint:** `GET /users/me`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "id": "user-uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "bio": "Optional bio text",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Notes:**
- Requires valid JWT access token
- Returns 401 for invalid/expired tokens
- Does not expose `passwordHash` or `role` in response

## Testing with Scalar

The Reedo backend uses Scalar for interactive API documentation.

### Accessing Scalar

1. Start the development server:
   ```bash
   npm run start:dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/docs
   ```

### Using Scalar for Auth Testing

#### 1. Register a New User

1. Find the `POST /auth/register` endpoint
2. Click "Try it out"
3. Fill in the request body:
   ```json
   {
     "username": "testuser",
     "email": "test@example.com",
     "password": "Test123456!"
   }
   ```
4. Click "Execute"
5. Copy the `accessToken` and `refreshToken` from the response

#### 2. Login

1. Find the `POST /auth/login` endpoint
2. Click "Try it out"
3. Fill in the request body with your credentials
4. Click "Execute"
5. Copy the new tokens

#### 3. Access Protected Endpoints

1. Find a protected endpoint (e.g., `GET /users/me`)
2. Click "Authorize" button (usually a lock icon)
3. Enter your access token in the format: `Bearer <your-token>`
4. Click "Authorize"
5. Click "Try it out" on the endpoint
6. Click "Execute"

#### 4. Test Token Refresh

1. Find the `POST /auth/refresh` endpoint
2. Click "Try it out"
3. Enter your refresh token
4. Click "Execute"
5. Use the new access token for subsequent requests

#### 5. Test Logout

1. Find the `POST /auth/logout` endpoint
2. Click "Try it out"
3. Enter your refresh token
4. Click "Execute"
5. Clear your tokens from the authorization header

### Scalar Tips

- **Authorization:** Use the "Authorize" button to set your access token globally for all requests
- **Response History:** Scalar keeps a history of your requests for easy reference
- **Request Examples:** Each endpoint includes example request bodies
- **Response Models:** View the expected response structure for each endpoint

## Authentication Flow

### Standard Flow

```
1. Register/Login
   ↓
2. Receive accessToken + refreshToken
   ↓
3. Store tokens securely (accessToken in memory, refreshToken in secure storage)
   ↓
4. Use accessToken for API requests (Authorization: Bearer <token>)
   ↓
5. If accessToken expires (401 response):
   ↓
6. Call /auth/refresh with refreshToken
   ↓
7. Receive new accessToken + refreshToken
   ↓
8. Update stored tokens
   ↓
9. Retry original request
   ↓
10. On logout: call /auth/refresh and clear local tokens
```

### Token Lifetimes

- **Access Token:** 15 minutes (configurable via `JWT_EXPIRES_IN`)
- **Refresh Token:** 30 days (configurable via `REFRESH_TOKEN_EXPIRES_IN`)

### Security Best Practices

1. **Access Token:** Store in memory (not localStorage/cookies)
2. **Refresh Token:** Store in secure storage (e.g., Flutter's flutter_secure_storage)
3. **HTTPS:** Always use HTTPS in production
4. **Token Rotation:** The system automatically rotates refresh tokens
5. **Session Revocation:** Logout revokes the refresh token immediately

## Common Use Cases

### Creating an Admin User

```bash
npm run seed:admin
```

Then login with:
- Email: `admin@gmail.com`
- Password: `Admin12345678!`

### Testing Protected Endpoints

1. Register or login to get tokens
2. Use the access token in the Authorization header
3. Make requests to protected endpoints

### Handling Token Expiration

When you receive a 401 response:
1. Call `/auth/refresh` with your refresh token
2. Update your stored tokens
3. Retry the original request with the new access token

### Implementing Remember Me

The refresh token's 30-day expiration naturally supports "remember me" functionality:
- User logs in with "remember me" checked
- Store the refresh token in secure storage
- Use it to get new access tokens even after the app closes
- User stays logged in for up to 30 days

### Multi-Device Support

The system supports multiple simultaneous sessions per user:
- Each login creates a new refresh token
- Each device can have its own session
- Logout only affects the specific session being revoked
- All sessions can be revoked by revoking all tokens for a user

## Troubleshooting

### "Refresh token is invalid or expired"

- The refresh token may have been revoked (logout)
- The refresh token may have expired (30 days)
- The refresh token format is incorrect

### 401 Unauthorized on Protected Endpoints

- Check that the access token is valid
- Ensure the token hasn't expired (15 minutes)
- Verify the Authorization header format: `Bearer <token>`

### Admin Seeder Creates Duplicate Users

- The seeder is idempotent and should not create duplicates
- If duplicates appear, check your database for existing admin users
- Ensure you're not running multiple seeder instances simultaneously

### Scalar Shows 404

- Ensure the development server is running
- Check that you're accessing the correct URL: `http://localhost:3000/docs`
- Verify the port hasn't changed in your configuration

## Next Steps

- See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for details on how the auth system works internally
- See [FLUTTER_INTEGRATION.md](./FLUTTER_INTEGRATION.md) for Flutter client integration guide
