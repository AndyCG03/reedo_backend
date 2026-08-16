// prisma.config.ts
// Prisma CLI configuration.
//
// - `datasource.url` feeds prisma CLI commands (migrate/studio/introspect).
// - It uses DIRECT_URL when present (direct/session-mode connection, required
//   for `prisma migrate` against poolers like Supabase's), falling back to
//   DATABASE_URL for local development where both point at the same database.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});