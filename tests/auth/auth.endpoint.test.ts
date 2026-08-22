import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, UnauthorizedException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as (app: any) => any;
import { AuthController, MeEndpoint } from '../../src/modules/auth/auth.controller';
import { AuthService } from '../../src/modules/auth/auth.service';
import { JwtAuthGuard } from '../../src/modules/auth/guards/jwt-auth.guard';
import { User } from '../../src/modules/users/domain/user';

// ── Stub AuthService ───────────────────────────────────────────────────────────

const stubTokens = { accessToken: 'access-token', refreshToken: 'uuid.secret' };

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
};

// ── Stub user for JwtAuthGuard ─────────────────────────────────────────────────

const stubUser = new User(
  'user-uuid-1',
  'testuser',
  'test@example.com',
  null,
  null,
  null,
  'USER',
  new Date('2026-01-01'),
  new Date('2026-01-01'),
);

// Guard that always passes and injects the stub user
class MockJwtAuthGuard {
  canActivate(context: any) {
    context.switchToHttp().getRequest().user = stubUser;
    return true;
  }
}

// ── Test setup ─────────────────────────────────────────────────────────────────

async function buildApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [AuthController, MeEndpoint],
    providers: [{ provide: AuthService, useValue: mockAuthService }],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(MockJwtAuthGuard)
    .compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Auth endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── POST /auth/register ──────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('returns 201 with tokens on valid payload', async () => {
      mockAuthService.register.mockResolvedValue(stubTokens);

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'newuser', email: 'new@example.com', password: 'Password123!' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(stubTokens);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'newuser', email: 'new@example.com' }),
      );
    });

    it('returns 400 when password is too short', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'newuser', email: 'new@example.com', password: 'short' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'newuser', email: 'not-an-email', password: 'Password123!' });

      expect(res.status).toBe(400);
    });
  });

  // ── POST /auth/login ─────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('returns 200 with tokens on valid credentials', async () => {
      mockAuthService.login.mockResolvedValue(stubTokens);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(stubTokens);
    });

    it('returns 401 when service throws UnauthorizedException', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials.'));

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPass!' });

      expect(res.status).toBe(401);
    });
  });

  // ── POST /auth/refresh ───────────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('returns 200 with new tokens', async () => {
      mockAuthService.refresh.mockResolvedValue(stubTokens);

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'uuid.secret' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(stubTokens);
    });

    it('returns 400 when refreshToken is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ── POST /auth/logout ────────────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('returns 204', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: 'uuid.secret' });

      expect(res.status).toBe(204);
    });
  });

  // ── GET /users/me ────────────────────────────────────────────────────────────

  describe('GET /users/me', () => {
    it('returns 200 with the authenticated user', async () => {
      const res = await request(app.getHttpServer()).get('/users/me');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(stubUser.id);
      expect(res.body.username).toBe(stubUser.username);
      // passwordHash must never appear in the response
      expect(res.body).not.toHaveProperty('passwordHash');
    });
  });
});
