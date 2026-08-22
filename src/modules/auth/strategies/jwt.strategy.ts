import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from '../auth.service';
import { User } from '../../users/domain/user';

/**
 * Passport JWT strategy.
 *
 * Validates the Bearer token on every protected request and attaches the
 * resolved User aggregate to request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  public constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? 'change-me-in-production',
    });
  }

  public async validate(payload: JwtPayload): Promise<User> {
    return this.authService.validatePayload(payload);
  }
}
