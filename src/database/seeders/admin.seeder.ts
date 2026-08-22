import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import appConfig from '../../common/config/app.config';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Minimal bootstrap module for the seeder — only needs Prisma and config.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    PrismaModule,
  ],
})
class SeederAppModule {}

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin12345678!';
const ADMIN_USERNAME = 'admin';

/**
 * Admin seeder.
 *
 * Idempotent: if an admin user with email `admin@gmail.com` already exists,
 * it does nothing. Safe to run multiple times and in CI.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register src/database/seeders/admin.seeder.ts
 *
 * Or via the npm script:
 *   npm run seed:admin
 */
async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(SeederAppModule, {
    logger: ['error', 'warn'],
  });

  const prisma = app.get(PrismaService);

  try {
    const existing = await prisma.user.findFirst({
      where: { email: ADMIN_EMAIL },
    });

    if (existing) {
      console.log(`✔  Admin user already exists (id: ${existing.id}). Nothing to do.`);
      return;
    }

    const passwordHash = await argon2.hash(ADMIN_PASSWORD);

    const admin = await prisma.user.create({
      data: {
        id: randomUUID(),
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'ADMIN',
      },
    });

    console.log(`✔  Admin user created.`);
    console.log(`   id:       ${admin.id}`);
    console.log(`   email:    ${admin.email}`);
    console.log(`   username: ${admin.username}`);
    console.log(`   role:     ${admin.role}`);
  } finally {
    await app.close();
  }
}

seed().catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
