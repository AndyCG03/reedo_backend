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
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '30d',
  },
  database: {
    /**
     * Runtime connection string consumed by Prisma Client through the `pg`
     * driver adapter. In dev/prod it points to the Supabase transaction
     * pooler (port 6543, pgbouncer); locally it points at the direct
     * PostgreSQL connection.
     */
    url: process.env.DATABASE_URL,
    /**
     * Direct/session-mode connection used by the Prisma CLI for migrations
     * against poolers (Supabase port 5432). Falls back to the runtime URL
     * for local setups where both point at the same database.
     */
    directUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
