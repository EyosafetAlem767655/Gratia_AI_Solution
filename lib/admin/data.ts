import { desc, eq, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import {
  albertConversations,
  buildEvents,
  builds,
  user,
  type AlbertConversation,
  type BuildStatus,
} from "@/lib/db/schema";
import { ADMIN } from "@/lib/content";

/**
 * Everything /admin reads. Every caller checks isAdmin() first: nothing here
 * is scoped to a user, because the owner sees every request.
 */

export const STAGES = ["interview", "unsent", "review", "working", "delivered", "stopped"] as const;
export type Stage = (typeof STAGES)[number];

const STAGE_OF_BUILD: Record<BuildStatus, Stage> = {
  awaiting_approval: "review",
  design_review: "review",
  plan_review: "review",
  failed: "review",
  designing: "working",
  clarifying: "working",
  planning: "working",
  building: "working",
  paused: "working",
  delivered: "delivered",
  rejected: "stopped",
};

export function stageOf(conversation: AlbertConversation["status"], build: BuildStatus | null): Stage {
  if (build) return STAGE_OF_BUILD[build];
  return conversation === "interviewing" ? "interview" : "unsent";
}

export function toneOf(stage: Stage, buildStatus: BuildStatus | null) {
  if (buildStatus === "failed") return "bad" as const;
  if (stage === "review") return "waiting" as const;
  return stage === "delivered" ? ("good" as const) : ("neutral" as const);
}

export function statusLabel(row: {
  conversationStatus: AlbertConversation["status"];
  buildStatus: BuildStatus | null;
}) {
  const status = row.buildStatus ?? row.conversationStatus;
  return status in ADMIN.statuses ? ADMIN.statuses[status as keyof typeof ADMIN.statuses] : status;
}

const BROWSE_LIMIT = 500;

export async function listRequests() {
  const rows = await requireDb()
    .select({
      id: albertConversations.id,
      conversationStatus: albertConversations.status,
      title: sql<string | null>`${albertConversations.brief}->>'title'`,
      problem: sql<string>`${albertConversations.transcript}->>'problem'`,
      rounds: sql<number>`jsonb_array_length(${albertConversations.transcript}->'rounds')`,
      risk: sql<string | null>`${albertConversations.guardVerdict}->>'risk'`,
      conversationUpdated: albertConversations.updatedAt,
      buildStatus: builds.status,
      currentPhase: builds.currentPhase,
      totalPhases: builds.totalPhases,
      buildUpdated: builds.updatedAt,
      clientName: user.name,
      clientEmail: user.email,
    })
    .from(albertConversations)
    .leftJoin(builds, eq(builds.conversationId, albertConversations.id))
    .leftJoin(user, eq(user.id, albertConversations.userId))
    .orderBy(desc(albertConversations.updatedAt))
    .limit(BROWSE_LIMIT);

  return rows
    .map((row) => ({
      ...row,
      stage: stageOf(row.conversationStatus, row.buildStatus),
      lastActive:
        row.buildUpdated && row.buildUpdated > row.conversationUpdated
          ? row.buildUpdated
          : row.conversationUpdated,
    }))
    .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
}
export type RequestRow = Awaited<ReturnType<typeof listRequests>>[number];

export async function getRequest(id: string) {
  const database = requireDb();
  const [row] = await database
    .select({ conversation: albertConversations, build: builds, client: user })
    .from(albertConversations)
    .leftJoin(builds, eq(builds.conversationId, albertConversations.id))
    .leftJoin(user, eq(user.id, albertConversations.userId))
    .where(eq(albertConversations.id, id))
    .limit(1);
  if (!row) return null;

  const events = row.build
    ? await database
        .select({ id: buildEvents.id, message: buildEvents.message, createdAt: buildEvents.createdAt })
        .from(buildEvents)
        .where(eq(buildEvents.buildId, row.build.id))
        .orderBy(desc(buildEvents.createdAt))
    : [];

  return { ...row, events, stage: stageOf(row.conversation.status, row.build?.status ?? null) };
}

/** Relative on purpose: the server's clock is UTC and the owner's is not. */
export function ago(date: Date) {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}
