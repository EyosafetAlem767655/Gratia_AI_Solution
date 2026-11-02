import { z } from "zod";

/**
 * Shapes shared by Albert, the build pipeline and the UI.
 *
 * Every length cap here is deliberate. Visitor text is untrusted, and the only
 * thing that ever leaves this site for Claude is an `AlbertBrief` — written by
 * Albert, validated against this schema, and read by the owner before
 * approval. Caps keep that document reviewable at a glance and leave no room
 * to smuggle a long payload through it.
 */

export const MAX_ROUNDS = 6;
export const QUESTIONS_PER_ROUND = 5;

export const questionSchema = z.object({
  id: z.string().min(1).max(40),
  /** single = pick one, multi = pick any, text = write an answer. */
  type: z.enum(["single", "multi", "text"]),
  text: z.string().min(1).max(300),
  options: z.array(z.string().min(1).max(120)).max(8).default([]),
  /** Adds an "Other" choice with its own text box. Ignored for text questions. */
  allowOther: z.boolean().default(false),
});
export type AlbertQuestion = z.infer<typeof questionSchema>;

export const answerSchema = z.object({
  choices: z.array(z.string().max(120)).max(8).default([]),
  other: z.string().trim().max(500).default(""),
  text: z.string().trim().max(1500).default(""),
});
export type AlbertAnswer = z.infer<typeof answerSchema>;

export const answersSchema = z.record(z.string().max(40), answerSchema);
export type AlbertAnswers = z.infer<typeof answersSchema>;

export type AlbertRound = {
  message: string;
  questions: AlbertQuestion[];
  answers: AlbertAnswers | null;
};

export type AlbertTranscript = {
  problem: string;
  rounds: AlbertRound[];
};

const capped = (n: number) => z.string().max(n);
const list = (n: number, len = 300) => z.array(capped(len)).max(n);

export const briefSchema = z.object({
  title: capped(100),
  summary: capped(600),
  problem: capped(1200),
  projectType: z.enum([
    "web_app",
    "mobile_app",
    "ai_agent",
    "rag_system",
    "computer_vision",
    "dashboard",
    "automation",
    "other",
  ]),
  users: list(8),
  goals: list(8),
  features: z
    .array(
      z.object({
        name: capped(80),
        detail: capped(400),
        priority: z.enum(["must", "should", "could"]),
      }),
    )
    .max(20),
  dataAndIntegrations: list(10),
  constraints: list(10),
  successCriteria: list(8),
  openQuestions: list(8),
});
export type AlbertBrief = z.infer<typeof briefSchema>;

export const guardVerdictSchema = z.object({
  risk: z.enum(["none", "low", "high"]),
  reasons: list(6),
});
export type GuardVerdict = z.infer<typeof guardVerdictSchema>;

/** Written by Claude to .gratia/questions.json during the design stage. */
export const claudeQuestionSchema = z.object({
  id: capped(40),
  question: capped(400),
  why: capped(400).default(""),
});
export type ClaudeQuestion = z.infer<typeof claudeQuestionSchema> & {
  /** Filled in by Albert from the transcript, or by the client. */
  answer?: string;
};

export const buildPlanSchema = z.object({
  phases: z
    .array(
      z.object({
        number: z.number().int().min(1),
        title: capped(120),
        goal: capped(600),
        tasks: list(20, 300),
        estimatedMinutes: z.number().min(5).max(240),
      }),
    )
    .min(1)
    .max(20),
});
export type BuildPlan = z.infer<typeof buildPlanSchema>;

export type Stage = "design" | "plan" | "build";
export type PendingDispatch = { stage: Stage; phase: number };
