import {
  bigint,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
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

export const telegramSessions = pgTable("telegram_sessions", {
  chatId: bigint("chat_id", { mode: "number" }).primaryKey(),
  step: bigint("step", { mode: "number" }).notNull().default(0),
  partialData: jsonb("partial_data").$type<Record<string, string>>(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const contactSubmissions = pgTable("contact_submissions", {
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
