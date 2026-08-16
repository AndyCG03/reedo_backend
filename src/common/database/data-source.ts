import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import appConfig from '../config/app.config';
import { UserProfileEntity } from '../../modules/user-profile/infrastructure/persistence/typeorm/user-profile.entity';

/**
 * TypeORM CLI data source, used by the migration commands
 * (see package.json scripts). It mirrors the runtime connection built in
 * DatabaseModule but is tailored for the CLI.
 *
 * IMPORTANT: unlike the runtime module (which uses `autoLoadEntities`), the
 * CLI cannot discover entities, so every entity must be registered here
 * manually. Keep this list in sync when adding new slices/entities.
 */

// Load the same .env file used at runtime. Existing process.env values
// (e.g. inline DB_DATABASE=... overrides) take precedence over the file.
loadEnv();

const { database } = appConfig();

export default new DataSource({
  type: 'postgres',
  host: database.host,
  port: database.port,
  username: database.username,
  password: database.password,
  database: database.database,
  ssl: database.ssl ? { rejectUnauthorized: false } : false,
  entities: [UserProfileEntity],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
