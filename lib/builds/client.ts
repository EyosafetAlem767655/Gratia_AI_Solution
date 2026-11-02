import { and, asc, desc, eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { estimateHours } from "@/lib/builds/orchestrator";
import { requireDb } from "@/lib/db";
import { albertConversations, buildEvents, builds, type Build } from "@/lib/db/schema";

/** A build, but only if the signed-in user owns it. */
export async function loadOwnedBuild(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const user = await currentUser();
  if (!user) return null;
  const [build] = await requireDb()
    .select()
    .from(builds)
    .where(and(eq(builds.id, id), eq(builds.userId, user.id)))
    .limit(1);
  return build ?? null;
}

/**
 * What the client sees. Deliberately excludes the repo name, design text and
 * anything else internal; the code reaches them only through the download
 * route, which checks ownership again.
 */
export async function clientView(build: Build) {
  const database = requireDb();
  const [conversation] = await database
    .select({ brief: albertConversations.brief })
    .from(albertConversations)
    .where(eq(albertConversations.id, build.conversationId))
    .limit(1);
  const events = await database
    .select({ message: buildEvents.message, createdAt: buildEvents.createdAt })
    .from(buildEvents)
    .where(eq(buildEvents.buildId, build.id))
    .orderBy(asc(buildEvents.createdAt));

  const hoursLeft =
    build.plan && ["building", "paused"].includes(build.status)
      ? estimateHours(build.plan, build.currentPhase + 1)
      : build.status === "plan_review" || build.status === "planning"
        ? build.etaHours
        : null;

  return {
    id: build.id,
    title: conversation?.brief?.title ?? "Your project",
    summary: conversation?.brief?.summary ?? "",
    status: build.status,
    currentPhase: build.currentPhase,
    totalPhases: build.totalPhases,
    phases: build.plan?.phases.map((p) => ({ number: p.number, title: p.title })) ?? [],
    etaHours: build.etaHours,
    hoursLeft,
    previewUrl: build.previewUrl,
    canDownload: Boolean(build.repoName) && build.currentPhase > 0,
    questions:
      build.status === "clarifying"
        ? (build.claudeQuestions ?? [])
            .filter((q) => !q.answer)
            .map((q) => ({ id: q.id, question: q.question }))
        : [],
    events,
    createdAt: build.createdAt,
  };
}
export type ClientBuildView = Awaited<ReturnType<typeof clientView>>;

export async function listOwnBuilds(userId: string) {
  const database = requireDb();
  return database
    .select({
      id: builds.id,
      status: builds.status,
      brief: albertConversations.brief,
      createdAt: builds.createdAt,
    })
    .from(builds)
    .innerJoin(albertConversations, eq(albertConversations.id, builds.conversationId))
    .where(eq(builds.userId, userId))
    .orderBy(desc(builds.createdAt));
}
