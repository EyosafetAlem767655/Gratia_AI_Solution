import {
  bigint,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Gratia's tables live in their own Postgres schema, not in `public`.
 *
 * This database is shared with another application. On 2026-08-19 all three
 * Gratia tables vanished and the Telegram bot started failing on
 * `insert into "telegram_sessions" ... on conflict`. The migration journal
 * (drizzle.__drizzle_migrations) still recorded our migration as applied from
 * 2026-08-14, so the tables had been created successfully and then dropped by
 * something else: `drizzle-kit push` deletes any table in its target schema
 * that is absent from the schema file it was given, and the other project's
 * table list had grown by seven in that window.
 *
 * Namespacing is the fix. drizzle-kit's `schemaFilter` defaults to
 * `["public"]`, so a push run from the other project cannot see these tables,
 * let alone drop them. The connection string is unchanged — a schema is just a
 * namespace inside the same database, so this costs nothing and needs no new
 * environment variables.
 *
 * The protection runs both ways: drizzle.config.ts pins `schemaFilter` to
 * `["gratia"]`, so a push run from THIS project can never drop the other
 * application's tables either.
 */
export const gratia = pgSchema("gratia");

export const projects = gratia.table("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name").notNull(),
  companyLogoUrl: text("company_logo_url").notNull(),
  description: text("description").notNull(),
  testimonial: text("testimonial").notNull(),
  aiSummary: text("ai_summary"),
  industry: text("industry"),
  displayLayout: text("display_layout"),
  generatedImageUrl: text("generated_image_url"),
  sceneConfig: jsonb("scene_config"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const telegramSessions = gratia.table("telegram_sessions", {
  chatId: bigint("chat_id", { mode: "number" }).primaryKey(),
  step: bigint("step", { mode: "number" }).notNull().default(0),
  partialData: jsonb("partial_data").$type<Record<string, string>>(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const contactSubmissions = gratia.table("contact_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
