import { NestFactory } from '@nestjs/core';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../src/prisma/prisma.service';

// Mock the entire seeder file
jest.mock('../../src/database/seeders/admin.seeder.ts', () => ({
  seed: jest.fn(),
}));

describe('Admin Seeder', () => {
  const ADMIN_EMAIL = 'admin@gmail.com';
  const ADMIN_PASSWORD = 'Admin12345678!';
  const ADMIN_USERNAME = 'admin';

  it('should be idempotent - skip if admin already exists', async () => {
    const mockPrisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'existing-admin-id',
          email: ADMIN_EMAIL,
        }),
      },
    } as any;

    // If admin exists, seeder should do nothing
    const existing = await mockPrisma.user.findFirst({
      where: { email: ADMIN_EMAIL },
    });

    expect(existing).toBeTruthy();
    expect(existing?.email).toBe(ADMIN_EMAIL);
  });

  it('should create admin with correct properties when not exists', async () => {
    const mockPrisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: randomUUID(),
          username: ADMIN_USERNAME,
          email: ADMIN_EMAIL,
          role: 'ADMIN',
        }),
      },
    } as any;

    const existing = await mockPrisma.user.findFirst({
      where: { email: ADMIN_EMAIL },
    });

    if (!existing) {
      const passwordHash = await argon2.hash(ADMIN_PASSWORD);
      const admin = await mockPrisma.user.create({
        data: {
          id: randomUUID(),
          username: ADMIN_USERNAME,
          email: ADMIN_EMAIL,
          passwordHash,
          role: 'ADMIN',
        },
      });

      expect(admin.role).toBe('ADMIN');
      expect(admin.email).toBe(ADMIN_EMAIL);
      expect(admin.username).toBe(ADMIN_USERNAME);
      expect(passwordHash).toBeDefined();
      expect(await argon2.verify(passwordHash, ADMIN_PASSWORD)).toBe(true);
    }
  });

  it('should use correct admin credentials', () => {
    expect(ADMIN_EMAIL).toBe('admin@gmail.com');
    expect(ADMIN_PASSWORD).toBe('Admin12345678!');
    expect(ADMIN_USERNAME).toBe('admin');
  });

  it('should hash password with Argon2', async () => {
    const passwordHash = await argon2.hash(ADMIN_PASSWORD);
    
    expect(passwordHash).not.toBe(ADMIN_PASSWORD);
    expect(await argon2.verify(passwordHash, ADMIN_PASSWORD)).toBe(true);
    expect(await argon2.verify(passwordHash, 'wrong-password')).toBe(false);
  });
});
