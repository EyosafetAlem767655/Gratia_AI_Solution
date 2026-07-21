import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Vercel's Neon integration exposes the pooled connection under several names
// (e.g. database_new_DATABASE_URL / database_new_POSTGRES_URL). Accept any of
// them so the app works whether the var is named DATABASE_URL or prefixed.
export function getConnectionString(): string | undefined {
  const env = process.env;
  return (
    env.DATABASE_URL ??
    env.POSTGRES_URL ??
    env.database_new_DATABASE_URL ??
    env.database_new_POSTGRES_URL ??
    env.database_new_POSTGRES_PRISMA_URL ??
    undefined
  );
}

const connectionString = getConnectionString();

function createDb() {
  if (!connectionString) {
    return null;
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export const db = createDb();

export function hasDatabase() {
  return Boolean(connectionString);
}

export function requireDb() {
  if (!db) {
    throw new Error("No database connection string is configured");
  }
  return db;
}
