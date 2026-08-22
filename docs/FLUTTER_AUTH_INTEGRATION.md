# Flutter Authentication Integration Guide

This document provides the Flutter team with all necessary information to integrate with the Reedo backend authentication system.

## Overview

The backend uses JWT-based authentication with refresh token rotation. The authentication flow is designed to provide a seamless user experience with automatic token refresh.

## Authentication Flow

### 1. Registration

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "username": "bookworm",
  "email": "user@example.com",
  "password": "SuperSecure123!",
  "bio": "Avid reader (optional)",
  "avatarUrl": "https://cdn.example.com/avatar.png (optional)"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid.secret"
}
```

### 2. Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SuperSecure123!"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid.secret"
}
```

### 3. Token Refresh (Automatic Rotation)

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "uuid.secret"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid.secret" // New refresh token (rotation)
}
```

### 4. Logout

**Endpoint:** `POST /auth/logout`

**Request Body:**
```json
{
  "refreshToken": "uuid.secret"
}
```

**Response (204):** No content

### 5. Get Current User

**Endpoint:** `GET /users/me`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "id": "user-uuid",
  "username": "bookworm",
  "email": "user@example.com",
  "bio": "Avid reader",
  "avatarUrl": "https://cdn.example.com/avatar.png",
  "role": "USER",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

## Token Management

### Access Token
- **Duration:** 15 minutes
- **Format:** JWT (JSON Web Token)
- **Usage:** Include in `Authorization: Bearer <token>` header for protected endpoints

### Refresh Token
- **Duration:** 30 days
- **Format:** `uuid.secret` (session ID + random secret)
- **Usage:** Stored securely and used to obtain new access tokens
- **Rotation:** Each refresh returns a new refresh token, invalidating the previous one

## Flutter Implementation Requirements

### 1. Secure Storage

Store tokens in the device's secure storage:
- **Android:** Use `flutter_secure_storage` or Android Keystore
- **iOS:** Use Keychain Services via `flutter_secure_storage`

**Example:**
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Save tokens
await storage.write(key: 'accessToken', value: accessToken);
await storage.write(key: 'refreshToken', value: refreshToken);

// Retrieve tokens
final accessToken = await storage.read(key: 'accessToken');
final refreshToken = await storage.read(key: 'refreshToken');

// Clear tokens (logout)
await storage.delete(key: 'accessToken');
await storage.delete(key: 'refreshToken');
```

### 2. HTTP Client Configuration

Configure your HTTP client (e.g., Dio, http) to:
1. Automatically include the access token in requests
2. Handle 401 responses by refreshing tokens
3. Retry the original request after successful refresh

**Example with Dio:**
```dart
import 'package:dio/dio.dart';

final dio = Dio();
final storage = FlutterSecureStorage();

dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) async {
    final accessToken = await storage.read(key: 'accessToken');
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    handler.next(options);
  },
  onError: (error, handler) async {
    if (error.response?.statusCode == 401) {
      // Token expired, try to refresh
      try {
        final refreshToken = await storage.read(key: 'refreshToken');
        if (refreshToken == null) {
          // No refresh token, user must login again
          return handler.next(error);
        }

        final response = await dio.post('/auth/refresh', data: {
          'refreshToken': refreshToken,
        });

        final newAccessToken = response.data['accessToken'];
        final newRefreshToken = response.data['refreshToken'];

        // Save new tokens
        await storage.write(key: 'accessToken', value: newAccessToken);
        await storage.write(key: 'refreshToken', value: newRefreshToken);

        // Retry original request with new token
        final opts = error.requestOptions;
        opts.headers['Authorization'] = 'Bearer $newAccessToken';
        final retryResponse = await dio.fetch(opts);
        return handler.resolve(retryResponse);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await storage.delete(key: 'accessToken');
        await storage.delete(key: 'refreshToken');
        // Navigate to login screen
        return handler.next(error);
      }
    }
    handler.next(error);
  },
));
```

### 3. Automatic Token Refresh Flow

When a 401 error occurs:
1. Extract the stored refresh token
2. Call `POST /auth/refresh` with the refresh token
3. If successful:
   - Save the new access token
   - Save the new refresh token (rotation)
   - Retry the original request with the new access token
4. If refresh fails:
   - Clear all stored tokens
   - Redirect user to login screen
   - Do NOT force the user to login again for normal token expiration

### 4. Logout Flow

When user logs out:
1. Call `POST /auth/logout` with the refresh token
2. Clear locally stored tokens (access + refresh)
3. Navigate to login screen

**Example:**
```dart
Future<void> logout() async {
  try {
    final refreshToken = await storage.read(key: 'refreshToken');
    if (refreshToken != null) {
      await dio.post('/auth/logout', data: {
        'refreshToken': refreshToken,
      });
    }
  } catch (e) {
    // Continue with local cleanup even if API call fails
  } finally {
    await storage.delete(key: 'accessToken');
    await storage.delete(key: 'refreshToken');
    // Navigate to login screen
  }
}
```

## Error Handling

### Common HTTP Status Codes

- **200 OK:** Successful request
- **201 Created:** Successful registration
- **204 No Content:** Successful logout
- **400 Bad Request:** Invalid request data (validation errors)
- **401 Unauthorized:** Invalid or expired access token
- **409 Conflict:** Email or username already exists (registration)

### Validation Errors

The backend uses class-validator. Validation errors return 400 with details:

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

## Security Best Practices

1. **Never store tokens in plain text:** Always use secure storage
2. **Never log tokens:** Ensure tokens are not included in crash reports or logs
3. **Clear tokens on logout:** Always remove tokens from secure storage
4. **Handle token expiration gracefully:** Use automatic refresh instead of forcing re-login
5. **Validate SSL/TLS:** Ensure all API calls use HTTPS in production

## Testing with Scalar API Documentation

The backend provides interactive API documentation at `/docs` (Scalar).

To test authentication in Scalar:
1. Open the API documentation
2. Use the `/auth/register` or `/auth/login` endpoint to get tokens
3. Click the "Authorize" button in Scalar
4. Enter the access token in the format: `Bearer <accessToken>`
5. All subsequent requests will include the token automatically

## Admin Access

For admin-specific endpoints, the access token must belong to a user with `role: "ADMIN"`. The admin seeder creates a default admin user:
- Email: `admin@gmail.com`
- Password: `Admin12345678!`

## Environment Configuration

The backend uses the following environment variables (configured server-side):
- `JWT_SECRET`: Secret for signing JWT tokens
- `JWT_EXPIRES_IN`: Access token duration (default: 15m)
- `REFRESH_TOKEN_EXPIRES_IN`: Refresh token duration (default: 30d)

These are server-side configurations and do not need to be managed by the Flutter app.

## Support

For any issues or questions regarding authentication integration, please contact the backend team.
