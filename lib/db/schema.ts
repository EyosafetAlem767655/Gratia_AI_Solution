import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  AlbertBrief,
  AlbertTranscript,
  BuildPlan,
  ClaudeQuestion,
  GuardVerdict,
  PendingDispatch,
} from "@/lib/albert/types";

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

/* ----------------------------------------------------------------------------
   Accounts (Better Auth)

   Better Auth's Drizzle adapter addresses columns by these TypeScript keys, so
   the keys must stay exactly as its core schema names them (`emailVerified`,
   `accessTokenExpiresAt`, ...). The SQL column names underneath are free, and
   follow this file's snake_case convention.
   -------------------------------------------------------------------------- */

export const user = gratia.table("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const session = gratia.table("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const account = gratia.table("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const verification = gratia.table("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ----------------------------------------------------------------------------
   Albert and the build pipeline
   -------------------------------------------------------------------------- */

/**
 * One interview with Albert.
 *
 * Starts anonymous: a visitor can describe their problem before deciding to
 * sign up, so the row is tied to an `anon_token` held in an httpOnly cookie
 * and adopted by `user_id` when they sign in to submit.
 */
export const albertConversations = gratia.table("albert_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  anonToken: text("anon_token").notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  transcript: jsonb("transcript").$type<AlbertTranscript>().notNull(),
  status: text("status")
    .$type<"interviewing" | "complete" | "submitted">()
    .notNull()
    .default("interviewing"),
  brief: jsonb("brief").$type<AlbertBrief>(),
  guardVerdict: jsonb("guard_verdict").$type<GuardVerdict>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BuildStatus =
  | "awaiting_approval"
  | "rejected"
  | "designing"
  | "clarifying"
  | "design_review"
  | "planning"
  | "plan_review"
  | "building"
  | "paused"
  | "delivered"
  | "failed";

/**
 * A client request from approval to delivery.
 *
 * `in_flight` + `pending_dispatch` are the queue. There is one Claude
 * subscription behind every build, so only one GitHub Actions run is allowed
 * at a time; a stage that wants to start while another is running is parked in
 * `pending_dispatch` and picked up by `drainQueue()` (lib/builds/orchestrator.ts).
 */
export const builds = gratia.table(
  "builds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => albertConversations.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    status: text("status").$type<BuildStatus>().notNull().default("awaiting_approval"),
    repoName: text("repo_name"),
    designMd: text("design_md"),
    diagramUrl: text("diagram_url"),
    plan: jsonb("plan").$type<BuildPlan>(),
    currentPhase: integer("current_phase").notNull().default(0),
    totalPhases: integer("total_phases").notNull().default(0),
    etaHours: integer("eta_hours"),
    previewUrl: text("preview_url"),
    claudeQuestions: jsonb("claude_questions").$type<ClaudeQuestion[]>(),
    clarifyRounds: integer("clarify_rounds").notNull().default(0),
    inFlight: boolean("in_flight").notNull().default(false),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
    pendingDispatch: jsonb("pending_dispatch").$type<PendingDispatch>(),
    pausedUntil: timestamp("paused_until", { withTimezone: true }),
    actionsMinutes: integer("actions_minutes").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("builds_user_idx").on(t.userId)],
);

/** The client-visible timeline on /projects/[id]. Plain language only. */
export const buildEvents = gratia.table(
  "build_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buildId: uuid("build_id")
      .notNull()
      .references(() => builds.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("build_events_build_idx").on(t.buildId)],
);

export type Build = typeof builds.$inferSelect;
export type AlbertConversation = typeof albertConversations.$inferSelect;
