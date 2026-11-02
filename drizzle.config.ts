import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit reads no env files, unlike `next dev`. The keys live in
// .env.local (from `vercel env pull`), so load it here; variables already set
// in the shell win, so CI and one-off overrides still work.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

// Prefer a direct (unpooled) connection for migrations; fall back to the pooled
// URLs the Vercel Neon integration provides (optionally prefixed database_new_).
const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.database_new_DATABASE_URL_UNPOOLED ??
  process.env.database_new_POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  process.env.database_new_DATABASE_URL ??
  process.env.database_new_POSTGRES_URL;

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl!,
  },
  // Gratia owns exactly one schema, and drizzle-kit must be told so.
  //
  // Without this, `push` defaults to ["public"] — where another application's
  // tables live — and push DROPS whatever it finds there that is not in our
  // schema file. That is the mirror image of the accident that deleted our own
  // tables, and it would take out someone else's data instead of ours.
  schemaFilter: ["gratia"],
});
