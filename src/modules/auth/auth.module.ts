import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthService } from './auth.service';
import { AuthController, MeEndpoint } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { USER_REPOSITORY } from '../users/domain/user.repository';
import { PrismaUserRepository } from '../users/infrastructure/persistence/prisma/prisma-user.repository';
import { REFRESH_TOKEN_REPOSITORY } from './domain/refresh-token.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma/prisma-refresh-token.repository';

/**
 * Auth vertical slice.
 *
 * Owns: registration, login, token refresh, logout, JWT strategy and guard.
 * The MeEndpoint is also here because it requires the JwtAuthGuard and the
 * CurrentUser decorator which belong to this slice.
 */
@Module({
  imports: [
    CqrsModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expiresIn: (config.get<string>('jwt.expiresIn') ?? '15m') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController, MeEndpoint],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
  ],
  exports: [JwtAuthGuard, RolesGuard, AuthService, JwtStrategy],
})
export class AuthModule {}
