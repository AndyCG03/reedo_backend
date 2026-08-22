# Flutter Authentication Integration Guide

This guide explains how to integrate the Reedo authentication system with a Flutter frontend, with a focus on creating a Duolingo-like smooth, engaging user experience.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Token Management](#token-management)
- [HTTP Client Setup](#http-client-setup)
- [Authentication Service](#authentication-service)
- [Duolingo-Like UI/UX](#duolingo-like-uiux)
- [State Management](#state-management)
- [Automatic Token Refresh](#automatic-token-refresh)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Best Practices](#best-practices)

## Overview

The Reedo backend uses JWT access tokens (15-minute expiry) and refresh tokens (30-day expiry). This guide shows how to create a Flutter app that:

- Seamlessly handles authentication
- Automatically refreshes tokens without user interruption
- Provides a Duolingo-like smooth onboarding experience
- Maintains secure token storage
- Handles errors gracefully

### Key Features

- **Silent Token Refresh:** Users never see "session expired" messages
- **Persistent Sessions:** Users stay logged in across app restarts
- **Smooth Transitions:** Animated onboarding like Duolingo
- **Secure Storage:** Tokens stored using flutter_secure_storage
- **Retry Logic:** Failed requests automatically retried after refresh

## Prerequisites

### Required Packages

Add these to your `pubspec.yaml`:

```yaml
dependencies:
  flutter_secure_storage: ^9.0.0
  http: ^1.1.0
  dio: ^5.4.0
  provider: ^6.1.0
  flutter_bloc: ^8.1.0
  shared_preferences: ^2.2.0
  equatable: ^2.0.5
```

### Backend Configuration

Ensure your backend is running and accessible:
```bash
npm run start:dev
```

Backend URL: `http://localhost:3000` (or your production URL)

## Project Setup

### Directory Structure

```
lib/
├── core/
│   ├── constants/
│   │   └── api_constants.dart
│   ├── error/
│   │   ├── exceptions.dart
│   │   └── failures.dart
│   ├── network/
│   │   ├── api_client.dart
│   │   └── dio_interceptor.dart
│   └── utils/
│       └── token_storage.dart
├── features/
│   └── auth/
│       ├── data/
│       │   ├── models/
│       │   │   ├── auth_response_model.dart
│       │   │   └── user_model.dart
│       │   ├── repositories/
│       │   │   └── auth_repository_impl.dart
│       │   └── datasources/
│       │       └── auth_remote_datasource.dart
│       ├── domain/
│       │   ├── entities/
│       │   │   ├── user_entity.dart
│       │   │   └── auth_response_entity.dart
│       │   ├── repositories/
│       │   │   └── auth_repository.dart
│       │   └── usecases/
│       │       ├── login_usecase.dart
│       │       ├── register_usecase.dart
│       │       ├── logout_usecase.dart
│       │       └── get_current_user_usecase.dart
│       └── presentation/
│           ├── bloc/
│           │   ├── auth_bloc.dart
│           │   └── auth_event.dart
│           │   └── auth_state.dart
│           ├── pages/
│           │   ├── login_page.dart
│           │   ├── register_page.dart
│           │   └── onboarding_page.dart
│           └── widgets/
│               ├── animated_button.dart
│               └── progress_indicator.dart
└── main.dart
```

## Token Management

### Token Storage Service

Create `lib/core/utils/token_storage.dart`:

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
    ),
  );

  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';

  // Access Token - stored in memory for security
  static String? _accessToken;

  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    _accessToken = accessToken;
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  static Future<String?> getAccessToken() async {
    if (_accessToken != null) return _accessToken;
    return await _storage.read(key: _accessTokenKey);
  }

  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  static Future<void> clearTokens() async {
    _accessToken = null;
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }

  static Future<bool> hasTokens() async {
    final accessToken = await getAccessToken();
    final refreshToken = await getRefreshToken();
    return accessToken != null && refreshToken != null;
  }

  static void setAccessToken(String token) {
    _accessToken = token;
  }
}
```

**Why This Approach:**
- Access token kept in memory (cleared on app restart)
- Refresh token stored securely in keychain
- Prevents token leakage from app state dumps
- Follows security best practices

## HTTP Client Setup

### Dio Configuration

Create `lib/core/network/api_client.dart`:

```dart
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import 'dio_interceptor.dart';
import '../utils/token_storage.dart';

class ApiClient {
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(AuthInterceptor());
    
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
      ));
    }
  }

  Dio get dio => _dio;
}
```

### Auth Interceptor with Token Refresh

Create `lib/core/network/dio_interceptor.dart`:

```dart
import 'package:dio/dio.dart';
import '../utils/token_storage.dart';
import '../../features/auth/data/datasources/auth_remote_datasource.dart';

class AuthInterceptor extends Interceptor {
  final AuthRemoteDataSource _authRemoteDataSource = AuthRemoteDataSource();
  bool _isRefreshing = false;
  final List<_RetryRequest> _retryRequests = [];

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final accessToken = TokenStorage._accessToken;
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (_shouldRefreshToken(err)) {
      if (!_isRefreshing) {
        _isRefreshing = true;
        try {
          await _refreshToken();
          _isRefreshing = false;
          
          // Retry all pending requests
          for (final request in _retryRequests) {
            try {
              final response = await _retry(request);
              request.handler.resolve(response);
            } catch (e) {
              request.handler.reject(e);
            }
          }
          _retryRequests.clear();
          
          // Retry the original request
          final response = await _retry(_RetryRequest(
            err.requestOptions,
            handler,
          ));
          handler.resolve(response);
          return;
        } catch (e) {
          _isRefreshing = false;
          _retryRequests.clear();
          await TokenStorage.clearTokens();
          handler.reject(err);
          return;
        }
      } else {
        // Queue the request if already refreshing
        _retryRequests.add(_RetryRequest(err.requestOptions, handler));
        return;
      }
    }
    handler.next(err);
  }

  bool _shouldRefreshToken(DioException err) {
    return err.response?.statusCode == 401 &&
           err.requestOptions.path != '/auth/login' &&
           err.requestOptions.path != '/auth/register';
  }

  Future<void> _refreshToken() async {
    final refreshToken = await TokenStorage.getRefreshToken();
    if (refreshToken == null) {
      throw Exception('No refresh token available');
    }

    final response = await _authRemoteDataSource.refreshToken(refreshToken);
    await TokenStorage.saveTokens(
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    );
  }

  Future<Response> _retry(_RetryRequest request) {
    final options = request.options;
    final accessToken = TokenStorage._accessToken;
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
    return Dio().fetch(options);
  }
}

class _RetryRequest {
  final RequestOptions options;
  final ErrorInterceptorHandler handler;

  _RetryRequest(this.options, this.handler);
}
```

**Key Features:**
- Automatic token refresh on 401 errors
- Request queuing during refresh (prevents duplicate refresh calls)
- Retry of failed requests after successful refresh
- Automatic logout on refresh failure

## Authentication Service

### Data Models

Create `lib/features/auth/data/models/auth_response_model.dart`:

```dart
import 'package:equatable/equatable.dart';
import '../../domain/entities/auth_response_entity.dart';

class AuthResponseModel extends Equatable {
  final String accessToken;
  final String refreshToken;

  const AuthResponseModel({
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    return AuthResponseModel(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
    };
  }

  AuthResponseEntity toEntity() {
    return AuthResponseEntity(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  @override
  List<Object?> get props => [accessToken, refreshToken];
}
```

### Remote Data Source

Create `lib/features/auth/data/datasources/auth_remote_datasource.dart`:

```dart
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../models/auth_response_model.dart';
import '../models/user_model.dart';

class AuthRemoteDataSource {
  final ApiClient _apiClient = ApiClient();

  Future<AuthResponseModel> register({
    required String username,
    required String email,
    required String password,
    String? bio,
    String? avatarUrl,
  }) async {
    final response = await _apiClient.dio.post(
      '/auth/register',
      data: {
        'username': username,
        'email': email,
        'password': password,
        if (bio != null) 'bio': bio,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
      },
    );

    return AuthResponseModel.fromJson(response.data);
  }

  Future<AuthResponseModel> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.dio.post(
      '/auth/login',
      data: {
        'email': email,
        'password': password,
      },
    );

    return AuthResponseModel.fromJson(response.data);
  }

  Future<AuthResponseModel> refreshToken(String refreshToken) async {
    final response = await _apiClient.dio.post(
      '/auth/refresh',
      data: {
        'refreshToken': refreshToken,
      },
    );

    return AuthResponseModel.fromJson(response.data);
  }

  Future<void> logout(String refreshToken) async {
    await _apiClient.dio.post(
      '/auth/logout',
      data: {
        'refreshToken': refreshToken,
      },
    );
  }

  Future<UserModel> getCurrentUser() async {
    final response = await _apiClient.dio.get('/users/me');
    return UserModel.fromJson(response.data);
  }
}
```

### Repository Implementation

Create `lib/features/auth/data/repositories/auth_repository_impl.dart`:

```dart
import 'package:dio/dio.dart';
import '../../domain/entities/auth_response_entity.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/auth_response_model.dart';
import '../models/user_model.dart';
import '../../../../core/utils/token_storage.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;

  AuthRepositoryImpl(this._remoteDataSource);

  @override
  Future<AuthResponseEntity> register({
    required String username,
    required String email,
    required String password,
    String? bio,
    String? avatarUrl,
  }) async {
    try {
      final authResponse = await _remoteDataSource.register(
        username: username,
        email: email,
        password: password,
        bio: bio,
        avatarUrl: avatarUrl,
      );

      await TokenStorage.saveTokens(
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      );

      return authResponse.toEntity();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  @override
  Future<AuthResponseEntity> login({
    required String email,
    required String password,
  }) async {
    try {
      final authResponse = await _remoteDataSource.login(
        email: email,
        password: password,
      );

      await TokenStorage.saveTokens(
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      );

      return authResponse.toEntity();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  @override
  Future<void> logout() async {
    try {
      final refreshToken = await TokenStorage.getRefreshToken();
      if (refreshToken != null) {
        await _remoteDataSource.logout(refreshToken);
      }
      await TokenStorage.clearTokens();
    } catch (e) {
      await TokenStorage.clearTokens();
      rethrow;
    }
  }

  @override
  Future<UserEntity?> getCurrentUser() async {
    try {
      if (!await TokenStorage.hasTokens()) {
        return null;
      }

      final user = await _remoteDataSource.getCurrentUser();
      return user.toEntity();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        await TokenStorage.clearTokens();
        return null;
      }
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return Exception('Connection timeout. Please check your internet.');
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message = error.response?.data['message'] ?? 'An error occurred';
        
        switch (statusCode) {
          case 401:
            return Exception('Invalid credentials');
          case 409:
            return Exception('User already exists');
          case 422:
            return Exception('Validation error: $message');
          default:
            return Exception(message);
        }
      default:
        return Exception('An unexpected error occurred');
    }
  }
}
```

## Duolingo-Like UI/UX

### Animated Onboarding

Create `lib/features/auth/presentation/pages/onboarding_page.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Theme.of(context).primaryColor,
              Theme.of(context).primaryColor.withOpacity(0.8),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo/Icon
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.book_rounded,
                          size: 60,
                          color: Colors.green,
                        ),
                      ),
                      const SizedBox(height: 40),
                      
                      // Title
                      Text(
                        'Welcome to Reedo',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      
                      // Subtitle
                      Text(
                        'Your reading journey starts here',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.white.withOpacity(0.9),
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 60),
                      
                      // Get Started Button
                      _AnimatedButton(
                        text: 'Get Started',
                        onPressed: () {
                          Navigator.push(
                            context,
                            PageRouteBuilder(
                              pageBuilder: (context, animation, secondaryAnimation) =>
                                  const RegisterPage(),
                              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                                const begin = Offset(1.0, 0.0);
                                const end = Offset.zero;
                                const curve = Curves.easeInOut;
                                var tween = Tween(begin: begin, end: end).chain(
                                  CurveTween(curve: curve),
                                );
                                return SlideTransition(
                                  position: animation.drive(tween),
                                  child: child,
                                );
                              },
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Login Link
                      TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            PageRouteBuilder(
                              pageBuilder: (context, animation, secondaryAnimation) =>
                                  const LoginPage(),
                              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                                const begin = Offset(1.0, 0.0);
                                const end = Offset.zero;
                                const curve = Curves.easeInOut;
                                var tween = Tween(begin: begin, end: end).chain(
                                  CurveTween(curve: curve),
                                );
                                return SlideTransition(
                                  position: animation.drive(tween),
                                  child: child,
                                );
                              },
                            ),
                          );
                        },
                        child: Text(
                          'I already have an account',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.8),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AnimatedButton extends StatefulWidget {
  final String text;
  final VoidCallback onPressed;

  const _AnimatedButton({
    required this.text,
    required this.onPressed,
  });

  @override
  State<_AnimatedButton> createState() => _AnimatedButtonState();
}

class _AnimatedButtonState extends State<_AnimatedButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onPressed();
      },
      onTapCancel: () => _controller.reverse(),
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          width: double.infinity,
          height: 56,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 15,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Center(
            child: Text(
              widget.text,
              style: const TextStyle(
                color: Colors.green,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

### Login Page with Animations

Create `lib/features/auth/presentation/pages/login_page.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/auth_bloc.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: BlocListener<AuthBloc, AuthState>(
          listener: (context, state) {
            if (state is AuthAuthenticated) {
              Navigator.pushReplacementNamed(context, '/home');
            } else if (state is AuthError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 20),
                  Text(
                    'Welcome back!',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Continue your reading journey',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 40),
                  
                  // Email Field
                  TextFormField(
                    controller: _emailController,
                    decoration: InputDecoration(
                      labelText: 'Email',
                      prefixIcon: const Icon(Icons.email_outlined),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                    ),
                    keyboardType: TextInputType.emailAddress,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your email';
                      }
                      if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                        return 'Please enter a valid email';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  
                  // Password Field
                  TextFormField(
                    controller: _passwordController,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                    ),
                    obscureText: _obscurePassword,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your password';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 8),
                  
                  // Forgot Password
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () {
                        // TODO: Implement forgot password
                      },
                      child: const Text('Forgot password?'),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Login Button
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      if (state is AuthLoading) {
                        return const Center(
                          child: CircularProgressIndicator(),
                        );
                      }
                      return ElevatedButton(
                        onPressed: () {
                          if (_formKey.currentState!.validate()) {
                            context.read<AuthBloc>().add(
                              LoginEvent(
                                email: _emailController.text,
                                password: _passwordController.text,
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Login',
                          style: TextStyle(fontSize: 16),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

## State Management

### Auth Bloc

Create `lib/features/auth/presentation/bloc/auth_bloc.dart`:

```dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/register_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/get_current_user_usecase.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final LoginUseCase _loginUseCase;
  final RegisterUseCase _registerUseCase;
  final LogoutUseCase _logoutUseCase;
  final GetCurrentUserUseCase _getCurrentUserUseCase;

  AuthBloc({
    required LoginUseCase loginUseCase,
    required RegisterUseCase registerUseCase,
    required LogoutUseCase logoutUseCase,
    required GetCurrentUserUseCase getCurrentUserUseCase,
  })  : _loginUseCase = loginUseCase,
        _registerUseCase = registerUseCase,
        _logoutUseCase = logoutUseCase,
        _getCurrentUserUseCase = getCurrentUserUseCase,
        super(AuthInitial()) {
    on<CheckAuthEvent>(_onCheckAuth);
    on<LoginEvent>(_onLogin);
    on<RegisterEvent>(_onRegister);
    on<LogoutEvent>(_onLogout);
  }

  Future<void> _onCheckAuth(
    CheckAuthEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    final user = await _getCurrentUserUseCase();
    if (user != null) {
      emit(AuthAuthenticated(user));
    } else {
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onLogin(
    LoginEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await _loginUseCase(
        LoginParams(email: event.email, password: event.password),
      );
      final user = await _getCurrentUserUseCase();
      if (user != null) {
        emit(AuthAuthenticated(user));
      }
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onRegister(
    RegisterEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await _registerUseCase(
        RegisterParams(
          username: event.username,
          email: event.email,
          password: event.password,
          bio: event.bio,
          avatarUrl: event.avatarUrl,
        ),
      );
      final user = await _getCurrentUserUseCase();
      if (user != null) {
        emit(AuthAuthenticated(user));
      }
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onLogout(
    LogoutEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await _logoutUseCase();
      emit(AuthUnauthenticated());
    } catch (e) {
      emit(AuthUnauthenticated());
    }
  }
}
```

## Automatic Token Refresh

The automatic token refresh is handled by the `AuthInterceptor` in the Dio configuration. Here's how it works:

### Refresh Flow

```
1. API Request Made
   ↓
2. Request Fails with 401
   ↓
3. Interceptor Catches Error
   ↓
4. Check if Refresh Needed
   ↓
5. Call /auth/refresh
   ↓
6. Update Stored Tokens
   ↓
7. Retry Original Request
   ↓
8. Return Response to App
```

### User Experience

- **Silent Refresh:** Users never see "session expired" messages
- **Seamless:** Failed requests are automatically retried
- **Queue Management:** Multiple simultaneous requests don't cause duplicate refresh calls
- **Fallback:** If refresh fails, user is logged out gracefully

## Error Handling

### Error States

```dart
sealed class AuthState extends Equatable {
  const AuthState();
  
  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthAuthenticated extends AuthState {
  final UserEntity user;
  
  const AuthAuthenticated(this.user);
  
  @override
  List<Object?> get props => [user];
}

class AuthUnauthenticated extends AuthState {}

class AuthError extends AuthState {
  final String message;
  
  const AuthError(this.message);
  
  @override
  List<Object?> get props => [message];
}
```

### Error Display

```dart
BlocListener<AuthBloc, AuthState>(
  listener: (context, state) {
    if (state is AuthError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.message),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'Dismiss',
            textColor: Colors.white,
            onPressed: () {
              ScaffoldMessenger.of(context).hideCurrentSnackBar();
            },
          ),
        ),
      );
    }
  },
  child: // Your UI
)
```

## Testing

### Unit Tests

```dart
test('should login user successfully', () async {
  // Arrange
  when(mockAuthRepository.login(
    email: any,
    password: any,
  )).thenAnswer((_) async => mockAuthResponse);

  // Act
  await loginUseCase(LoginParams(
    email: 'test@example.com',
    password: 'password123',
  ));

  // Assert
  verify(mockAuthRepository.login(
    email: 'test@example.com',
    password: 'password123',
  ));
});
```

### Integration Tests

```dart
testWidgets('should display error on invalid login', (tester) async {
  await tester.pumpWidget(
    MaterialApp(
      home: BlocProvider(
        create: (_) => AuthBloc(/* ... */),
        child: const LoginPage(),
      ),
    ),
  );

  await tester.enterText(
    find.byKey(const Key('email_field')),
    'invalid@email.com',
  );
  await tester.enterText(
    find.byKey(const Key('password_field')),
    'wrongpassword',
  );
  await tester.tap(find.byKey(const Key('login_button')));
  await tester.pump();

  expect(find.text('Invalid credentials'), findsOneWidget);
});
```

## Best Practices

### Security

1. **Never store access tokens in SharedPreferences** - Use flutter_secure_storage
2. **Clear tokens on logout** - Prevent unauthorized access
3. **Use HTTPS in production** - Protect tokens in transit
4. **Validate SSL certificates** - Prevent MITM attacks
5. **Implement certificate pinning** - Extra security layer

### Performance

1. **Cache user data** - Reduce API calls
2. **Optimize animations** - Use const constructors
3. **Lazy load images** - Improve initial load time
4. **Use pagination** - Handle large datasets
5. **Implement offline support** - Cache responses

### User Experience

1. **Provide feedback** - Show loading states
2. **Handle errors gracefully** - Don't crash the app
3. **Remember user preferences** - Improve engagement
4. **Implement biometric auth** - Faster login
5. **Social login options** - Reduce friction

### Code Quality

1. **Follow clean architecture** - Maintainable codebase
2. **Write tests** - Ensure reliability
3. **Use linters** - Consistent code style
4. **Document code** - Easier maintenance
5. **Use type safety** - Catch errors early

## Next Steps

- See [USAGE.md](./USAGE.md) for API endpoint details
- See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for backend implementation details
- Test the integration using Scalar at `http://localhost:3000/docs`
