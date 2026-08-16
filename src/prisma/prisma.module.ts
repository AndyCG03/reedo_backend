import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global Prisma module.
 *
 * Marked as @Global so PrismaService can be injected into any feature module
 * without re-importing PrismaModule every time. This replaces the former
 * TypeORM connection module (src/common/database/database.module.ts).
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
