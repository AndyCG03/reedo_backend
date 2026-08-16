import { PrismaPg } from '@prisma/adapter-pg';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma client service.
 *
 * Prisma 7 requires a driver adapter for the database connection instead of a
 * URL in the schema. We use the `pg` adapter with the runtime `DATABASE_URL`
 * (the transaction-mode pooler on Supabase, or the direct connection locally).
 *
 * The class is @Global via PrismaModule, so it can be injected into any
 * feature service (e.g. the user-profile repository adapter).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  public constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get<string>('database.url'),
      }),
    });
  }

  public async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
