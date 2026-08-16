import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Global database module.
 *
 * It boots the TypeORM connection from the environment configuration.
 * The connection itself is provider-agnostic (PostgreSQL now, other managed
 * providers later): feature modules depend on repository *ports* defined in
 * their own slice, so swapping the storage backend only requires providing a
 * different adapter, not touching the feature code.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        autoLoadEntities: true,
        // Dev convenience. Switch to database migrations (read the
        // "Database migrations" section of the README) by setting
        // DB_SYNCHRONIZE=false.
        synchronize: config.get<boolean>('database.synchronize'),
        // Migrations registered with the runtime connection.
        migrations: [`${__dirname}/migrations/*{.ts,.js}`],
        // Apply pending migrations at boot when DB_MIGRATIONS_RUN=true.
        migrationsRun: config.get<boolean>('database.migrationsRun'),
        // Required by Supabase and other managed PostgreSQL providers.
        ssl: config.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
  ],
})
export class DatabaseModule {}
