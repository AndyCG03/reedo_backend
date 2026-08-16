/**
 * Centralized application configuration.
 *
 * Values are read from the environment (loaded from a `.env` file by
 * `ConfigModule`) and exposed through the `ConfigService` for the rest
 * of the application to consume in a typed way.
 */
export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  docsPath: process.env.DOCS_PATH ?? 'docs',
  database: {
    /**
     * Storage backend selector. Lets us swap between local Postgres and a
     * managed provider (Supabase / Firebase) without touching feature code:
     * only the persistence adapter changes for the chosen provider.
     */
    provider: process.env.DATABASE_PROVIDER ?? 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? 'reading_platform',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    /**
     * Whether to apply pending migrations automatically at boot. Off by
     * default: migrations are usually run explicitly via the CLI scripts.
     */
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
    ssl: process.env.DB_SSL === 'true',
  },
});
