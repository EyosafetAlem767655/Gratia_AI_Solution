CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"company_logo_url" text NOT NULL,
	"description" text NOT NULL,
	"testimonial" text NOT NULL,
	"ai_summary" text,
	"industry" text,
	"display_layout" text,
	"generated_image_url" text,
	"scene_config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_sessions" (
	"chat_id" bigint PRIMARY KEY NOT NULL,
	"step" bigint DEFAULT 0 NOT NULL,
	"partial_data" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
