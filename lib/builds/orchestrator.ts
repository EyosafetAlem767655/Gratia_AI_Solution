import { and, asc, eq, inArray, isNotNull, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { answerClaudeQuestions, normaliseClientAnswers } from "@/lib/albert/albert";
import {
  buildPlanSchema,
  claudeQuestionSchema,
  type AlbertBrief,
  type BuildPlan,
  type ClaudeQuestion,
  type Stage,
} from "@/lib/albert/types";
import { uploadBuffer } from "@/lib/blob";
import { requireDb } from "@/lib/db";
import {
  albertConversations,
  buildEvents,
  builds,
  type AlbertConversation,
  type Build,
  type BuildStatus,
} from "@/lib/db/schema";
import {
  createRepoFromTemplate,
  dispatchWorkflow,
  githubConfigured,
  putFile,
  repoUrl,
} from "@/lib/github";
import {
  adminChatId,
  sendTelegramMessage,
  sendTelegramPhoto,
  type InlineKeyboard,
} from "@/lib/telegram/api";

/**
 * The build pipeline as a state machine.
 *
 *   awaiting_approval ─(owner approves brief)→ designing
 *   designing ─(Claude asks)→ clarifying ─(answers)→ designing
 *   designing → design_review ─(owner approves)→ planning → plan_review
 *   plan_review ─(owner starts)→ building (phase 1..N) → delivered
 *   any running stage ─(usage limit)→ paused ─(auto / Resume)→ same stage
 *
 * Every transition checks the status it expects before acting, so a double
 * tap on a Telegram button, or a callback delivered twice, does nothing the
 * second time.
 *
 * ONE RUN AT A TIME. Every build spends the same Claude subscription, so
 * running two in parallel only burns the usage window twice as fast. A stage
 * that wants to run is parked in `pending_dispatch`; `drainQueue()` starts the
 * oldest one whenever nothing is in flight.
 */

const MAX_CLARIFY_ROUNDS = 2;
/** Without a callback after this long, the run is assumed dead. */
const STALE_RUN_MS = 3 * 60 * 60 * 1000;
/** How long to wait after Claude reports its usage limit before retrying. */
const LIMIT_BACKOFF_MS = 60 * 60 * 1000;

const STAGE_STATUS: Record<Stage, BuildStatus> = {
  design: "designing",
  plan: "planning",
  build: "building",
};

/* --------------------------------------------------------------- helpers -- */

export async function logEvent(buildId: string, message: string) {
  await requireDb().insert(buildEvents).values({ buildId, message });
}

async function load(buildId: string) {
  const [build] = await requireDb().select().from(builds).where(eq(builds.id, buildId)).limit(1);
  if (!build) throw new Error(`Build ${buildId} not found`);
  return build;
}

async function loadConversation(build: Build) {
  const [conversation] = await requireDb()
    .select()
    .from(albertConversations)
    .where(eq(albertConversations.id, build.conversationId))
    .limit(1);
  if (!conversation?.brief) throw new Error(`Build ${build.id} has no brief`);
  return conversation as AlbertConversation & { brief: AlbertBrief };
}

async function update(buildId: string, values: Partial<Build>) {
  await requireDb()
    .update(builds)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(builds.id, buildId));
}

/**
 * Moves a build to `next` only if it is currently `from`. Returns false when
 * someone else got there first — the idempotency guard for every transition.
 */
async function transition(buildId: string, from: BuildStatus[], next: BuildStatus) {
  const rows = await requireDb()
    .update(builds)
    .set({ status: next, updatedAt: new Date() })
    .where(and(eq(builds.id, buildId), inArray(builds.status, from)))
    .returning({ id: builds.id });
  return rows.length > 0;
}

async function notifyOwner(text: string, buttons?: InlineKeyboard) {
  try {
    await sendTelegramMessage(adminChatId(), text, { buttons });
  } catch (error) {
    console.error("Owner notification failed:", error);
  }
}

function siteUrl(path = "") {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}${path}`;
}

/** Work time plus setup/deploy overhead per phase, with a buffer for usage-limit pauses. */
export function estimateHours(plan: BuildPlan, fromPhase = 1) {
  const remaining = plan.phases.filter((p) => p.number >= fromPhase);
  if (remaining.length === 0) return 0;
  const minutes = remaining.reduce((sum, p) => sum + p.estimatedMinutes + 10, 0) * 1.25;
  return Math.max(1, Math.ceil(minutes / 60));
}

function repoNameFor(brief: AlbertBrief, buildId: string) {
  const slug = brief.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${slug || "project"}-${buildId.slice(0, 8)}`;
}

/* ---------------------------------------------------------------- submit -- */

export async function submitBuild(
  conversation: AlbertConversation & { brief: AlbertBrief },
  client: { id: string; name: string; email: string },
) {
  const [build] = await requireDb()
    .insert(builds)
    .values({ conversationId: conversation.id, userId: client.id })
    .returning();

  await logEvent(build.id, "Request received. Our team is reviewing it.");

  const b = conversation.brief;
  const verdict = conversation.guardVerdict;
  const risk =
    verdict?.risk === "high"
      ? "⚠️ HIGH injection risk"
      : verdict?.risk === "low"
        ? "⚠️ Low injection risk"
        : "✅ No injection detected";

  const features = b.features
    .map((f) => `• [${f.priority}] ${f.name} — ${f.detail}`)
    .join("\n");

  await notifyOwner(
    [
      `🧾 New project request: ${b.title}`,
      `From: ${client.name} <${client.email}>`,
      `Type: ${b.projectType}`,
      "",
      b.summary,
      "",
      `Problem: ${b.problem}`,
      "",
      `Features:\n${features || "—"}`,
      b.dataAndIntegrations.length ? `\nData / integrations: ${b.dataAndIntegrations.join("; ")}` : "",
      b.constraints.length ? `Constraints: ${b.constraints.join("; ")}` : "",
      b.openQuestions.length ? `Open questions: ${b.openQuestions.join("; ")}` : "",
      "",
      `Safety check: ${risk}`,
      ...(verdict?.reasons.length ? verdict.reasons.map((r) => `  - ${r}`) : []),
    ]
      .filter((line) => line !== "")
      .join("\n"),
    [
      [
        { text: "✅ Approve — start design", callback_data: `ab:${build.id}` },
        { text: "❌ Reject", callback_data: `rj:${build.id}` },
      ],
    ],
  );

  return build;
}

/* ------------------------------------------------------ owner decisions -- */

export async function approveBrief(buildId: string) {
  const build = await load(buildId);
  if (build.status !== "awaiting_approval") return "Already handled.";
  if (!githubConfigured()) {
    // Albert and approvals can go live before the GitHub side is set up. The
    // request stays awaiting approval, so this button works once it is.
    return "Brief received, but the build pipeline isn't set up yet (GITHUB_TOKEN, GITHUB_BUILD_ORG, GITHUB_TEMPLATE_REPO). The request is kept; tap Approve again once those are configured.";
  }
  const conversation = await loadConversation(build);

  const repoName = build.repoName ?? repoNameFor(conversation.brief, build.id);
  await createRepoFromTemplate(repoName, conversation.brief.title.slice(0, 100));
  await putFile(
    repoName,
    ".gratia/brief.json",
    `${JSON.stringify(conversation.brief, null, 2)}\n`,
    "Add project brief",
  );
  await update(buildId, { repoName });

  if (!(await transition(buildId, ["awaiting_approval"], "designing"))) return "Already handled.";
  await logEvent(buildId, "Approved! Our engineers are now designing your system.");
  await requestDispatch(buildId, "design", 0);
  return `Approved. Repo ${repoName} created; design run queued.`;
}

export async function rejectBrief(buildId: string) {
  if (!(await transition(buildId, ["awaiting_approval"], "rejected"))) return "Already handled.";
  await logEvent(
    buildId,
    "We reviewed your request and can't take it on right now. We'll be in touch by email.",
  );
  return "Rejected.";
}

export async function approveDesign(buildId: string) {
  if (!(await transition(buildId, ["design_review"], "planning"))) return "Already handled.";
  await logEvent(buildId, "System design approved. Now planning the build step by step.");
  await requestDispatch(buildId, "plan", 0);
  return "Design approved; planning queued.";
}

export async function approvePlan(buildId: string) {
  if (!(await transition(buildId, ["plan_review"], "building"))) return "Already handled.";
  const build = await load(buildId);
  await logEvent(
    buildId,
    `Build started: ${build.totalPhases} phases, about ${build.etaHours ?? "?"} hours in total.`,
  );
  await requestDispatch(buildId, "build", 1);
  return "Build started.";
}

/** Owner feedback on a design or plan: written to the repo, and the stage re-runs. */
export async function requestChanges(buildId: string, feedback: string) {
  const build = await load(buildId);
  const stage: Stage | null =
    build.status === "design_review" ? "design" : build.status === "plan_review" ? "plan" : null;
  if (!stage || !build.repoName) return "Nothing is waiting for review on that build.";

  await putFile(
    build.repoName,
    ".gratia/owner-feedback.md",
    `# Feedback from the Gratia owner on the ${stage}\n\n${feedback}\n`,
    `Owner feedback on ${stage}`,
  );
  if (!(await transition(buildId, [build.status], STAGE_STATUS[stage]))) return "Already handled.";
  await logEvent(buildId, `Our team asked for changes to the ${stage}. Revising it now.`);
  await requestDispatch(buildId, stage, 0);
  return `Feedback saved; the ${stage} will be redone.`;
}

/** Retry after a failure, or skip the wait after a usage-limit pause. */
export async function resume(buildId: string) {
  const build = await load(buildId);
  if (!build.pendingDispatch || !["paused", "failed"].includes(build.status)) {
    return "Nothing to resume.";
  }
  await update(buildId, {
    status: STAGE_STATUS[build.pendingDispatch.stage],
    pausedUntil: null,
  });
  await logEvent(buildId, "Work resumed.");
  await drainQueue();
  return "Resumed.";
}

/* ----------------------------------------------------------------- queue -- */

async function requestDispatch(buildId: string, stage: Stage, phase: number) {
  await update(buildId, { pendingDispatch: { stage, phase }, pausedUntil: null });
  await drainQueue();
}

/**
 * Starts the oldest waiting stage if nothing is running.
 *
 * Called after every state change and callback, by the client's status page
 * as it polls, and by a daily cron as a backstop — so a paused build resumes
 * on its own without needing a scheduler that runs every few minutes.
 */
export async function drainQueue() {
  const database = requireDb();
  const now = new Date();

  // A run that never called back (runner died, callback failed) would block
  // the queue forever. Release it and tell the owner.
  const stale = await database
    .update(builds)
    .set({ inFlight: false, status: "failed", updatedAt: now })
    .where(and(eq(builds.inFlight, true), lt(builds.dispatchedAt, new Date(now.getTime() - STALE_RUN_MS))))
    .returning();
  for (const build of stale) {
    await logEvent(build.id, "A step took too long and stopped. Our team has been notified.");
    await notifyOwner(`⏱ Build ${build.repoName}: run never reported back. Marked failed.`, [
      [{ text: "🔁 Retry", callback_data: `rs:${build.id}` }],
    ]);
  }

  const [next] = await database
    .select()
    .from(builds)
    .where(
      and(
        isNotNull(builds.pendingDispatch),
        eq(builds.inFlight, false),
        ne(builds.status, "failed"),
        sql`(${builds.pausedUntil} is null or ${builds.pausedUntil} <= ${now})`,
      ),
    )
    .orderBy(asc(builds.updatedAt))
    .limit(1);
  if (!next?.pendingDispatch || !next.repoName) return;

  // Claim it in one statement: only if no run is in flight anywhere.
  const claimed = await database
    .update(builds)
    .set({
      inFlight: true,
      dispatchedAt: now,
      pendingDispatch: null,
      pausedUntil: null,
      status: STAGE_STATUS[next.pendingDispatch.stage],
      updatedAt: now,
    })
    .where(
      and(
        eq(builds.id, next.id),
        isNotNull(builds.pendingDispatch),
        sql`not exists (select 1 from ${builds} b2 where b2.in_flight)`,
      ),
    )
    .returning();
  if (claimed.length === 0) return;

  const { stage, phase } = next.pendingDispatch;
  try {
    await dispatchWorkflow(next.repoName, { stage, phase: String(phase), build_id: next.id });
  } catch (error) {
    await update(next.id, {
      inFlight: false,
      pendingDispatch: next.pendingDispatch,
      status: "failed",
    });
    await notifyOwner(
      `❗ Could not start ${stage} for ${next.repoName}: ${error instanceof Error ? error.message : error}`,
      [[{ text: "🔁 Retry", callback_data: `rs:${next.id}` }]],
    );
  }
}

/* -------------------------------------------------------------- callback -- */

export const callbackSchema = z.object({
  build_id: z.string().uuid(),
  repo: z.string(),
  stage: z.enum(["design", "plan", "build"]),
  phase: z.coerce.number().int().min(0),
  outcome: z.enum(["success", "failed", "limited"]),
  minutes: z.coerce.number().min(0).default(0),
  run_url: z.string().url().optional(),
  preview_url: z.string().optional(),
  design_md: z.string().max(200_000).optional(),
  diagram_png_base64: z.string().max(4_000_000).optional(),
  plan_json: z.string().max(100_000).optional(),
  questions_json: z.string().max(20_000).optional(),
});
export type BuildCallback = z.infer<typeof callbackSchema>;

export async function handleCallback(payload: BuildCallback) {
  const build = await load(payload.build_id);
  if (build.repoName !== payload.repo) throw new Error("Callback repo does not match build");

  await update(build.id, {
    inFlight: false,
    actionsMinutes: build.actionsMinutes + Math.ceil(payload.minutes),
  });

  try {
    if (payload.outcome === "limited") {
      await pause(build, payload);
    } else if (payload.outcome === "failed") {
      await fail(build, payload);
    } else if (payload.stage === "design") {
      await onDesignDone(build, payload);
    } else if (payload.stage === "plan") {
      await onPlanDone(build, payload);
    } else {
      await onPhaseDone(build, payload);
    }
  } finally {
    await drainQueue();
  }
}

async function pause(build: Build, payload: BuildCallback) {
  await update(build.id, {
    status: "paused",
    pendingDispatch: { stage: payload.stage, phase: payload.phase },
    pausedUntil: new Date(Date.now() + LIMIT_BACKOFF_MS),
  });
  await logEvent(build.id, "Taking a short break to respect AI usage limits. Work resumes automatically.");
  await notifyOwner(
    `⏸ ${build.repoName}: Claude hit its usage limit during ${payload.stage}${
      payload.stage === "build" ? ` phase ${payload.phase}` : ""
    }. Auto-retry in about an hour.`,
    [[{ text: "▶️ Resume now", callback_data: `rs:${build.id}` }]],
  );
}

async function fail(build: Build, payload: BuildCallback) {
  await update(build.id, {
    status: "failed",
    pendingDispatch: { stage: payload.stage, phase: payload.phase },
  });
  await logEvent(build.id, "We hit a problem and our team is looking at it.");
  await notifyOwner(
    `❗ ${build.repoName}: ${payload.stage}${payload.stage === "build" ? ` phase ${payload.phase}` : ""} failed.\n${
      payload.run_url ?? ""
    }`,
    [[{ text: "🔁 Retry", callback_data: `rs:${build.id}` }]],
  );
}

async function onDesignDone(build: Build, payload: BuildCallback) {
  if (build.status !== "designing") return;

  // Claude needs more information: Albert answers, or asks the client.
  const questions = parseQuestions(payload.questions_json);
  if (questions.length && build.clarifyRounds < MAX_CLARIFY_ROUNDS) {
    const conversation = await loadConversation(build);
    const answered = await answerClaudeQuestions(questions, conversation.transcript, conversation.brief);
    const open = answered.filter((q) => !q.answer);

    await update(build.id, { claudeQuestions: answered, clarifyRounds: build.clarifyRounds + 1 });

    if (open.length === 0) {
      await notifyOwner(
        `💬 ${build.repoName}: Claude asked ${questions.length} question(s); Albert answered all from the interview. Redesigning.`,
      );
      await sendAnswersToClaude(build, answered);
      return;
    }

    await transition(build.id, ["designing"], "clarifying");
    await logEvent(build.id, `Albert has ${open.length} more question(s) for you. Please answer them below.`);
    await notifyOwner(
      `💬 ${build.repoName}: Claude asked ${questions.length} question(s); Albert answered ${
        questions.length - open.length
      }. Waiting on the client for ${open.length}.`,
    );
    return;
  }

  if (!payload.design_md) {
    await fail(build, { ...payload, outcome: "failed" });
    return;
  }

  let diagramUrl: string | null = null;
  if (payload.diagram_png_base64) {
    try {
      diagramUrl = await uploadBuffer(
        `builds/${build.id}/architecture-${Date.now()}.png`,
        Buffer.from(payload.diagram_png_base64, "base64"),
        "image/png",
      );
    } catch (error) {
      console.error("Diagram upload failed:", error);
    }
  }

  await update(build.id, { designMd: payload.design_md, diagramUrl, status: "design_review" });
  await logEvent(build.id, "System design is ready and being reviewed by our team.");

  const summary = summariseMarkdown(payload.design_md, 900);
  const buttons: InlineKeyboard = [
    [
      { text: "✅ Approve design", callback_data: `ad:${build.id}` },
      { text: "✏️ Request changes", callback_data: `ch:${build.id}` },
    ],
    [{ text: "📄 Full design on GitHub", url: repoUrl(build.repoName!, "docs/ARCHITECTURE.md") }],
  ];
  const caption = `🏗 System design: ${build.repoName}\n\n${summary}`;

  try {
    if (diagramUrl) {
      await sendTelegramPhoto(adminChatId(), diagramUrl, caption, buttons);
      return;
    }
  } catch (error) {
    console.error("Diagram photo failed; falling back to text:", error);
  }
  await notifyOwner(`${caption}\n\n(No diagram could be rendered.)`, buttons);
}

async function onPlanDone(build: Build, payload: BuildCallback) {
  if (build.status !== "planning") return;

  let plan: BuildPlan;
  try {
    plan = buildPlanSchema.parse(JSON.parse(payload.plan_json ?? ""));
  } catch {
    await fail(build, { ...payload, outcome: "failed" });
    return;
  }
  plan.phases.sort((a, b) => a.number - b.number);
  plan.phases.forEach((p, i) => (p.number = i + 1));

  const etaHours = estimateHours(plan);
  await update(build.id, {
    plan,
    totalPhases: plan.phases.length,
    currentPhase: 0,
    etaHours,
    status: "plan_review",
  });
  await logEvent(
    build.id,
    `Build plan ready: ${plan.phases.length} phases, about ${etaHours} hours of work. Waiting for final approval.`,
  );

  const lines = plan.phases.map((p) => `${p.number}. ${p.title} (~${p.estimatedMinutes} min)`);
  await notifyOwner(
    `🗺 Build plan: ${build.repoName}\n\n${lines.join("\n")}\n\nEstimated total: about ${etaHours} hours (includes deploys and usage-limit pauses).`,
    [
      [
        { text: "🚀 Start build", callback_data: `sb:${build.id}` },
        { text: "✏️ Request changes", callback_data: `ch:${build.id}` },
      ],
      [{ text: "📄 Plan on GitHub", url: repoUrl(build.repoName!, "docs/PLAN.md") }],
    ],
  );
}

async function onPhaseDone(build: Build, payload: BuildCallback) {
  if (build.status !== "building" || payload.phase !== build.currentPhase + 1) return;

  const previewUrl = payload.preview_url?.startsWith("https://") ? payload.preview_url : build.previewUrl;
  const plan = build.plan;
  const title = plan?.phases.find((p) => p.number === payload.phase)?.title ?? `Phase ${payload.phase}`;
  const remaining = plan ? estimateHours(plan, payload.phase + 1) : 0;

  await update(build.id, { currentPhase: payload.phase, previewUrl });

  if (payload.phase < build.totalPhases) {
    await logEvent(
      build.id,
      `Finished phase ${payload.phase} of ${build.totalPhases}: ${title}. About ${remaining} hours left.`,
    );
    await requestDispatch(build.id, "build", payload.phase + 1);
    await notifyOwner(
      `✅ ${build.repoName}: phase ${payload.phase}/${build.totalPhases} done (${title}).${
        previewUrl ? `\nPreview: ${previewUrl}` : ""
      }`,
    );
    return;
  }

  await transition(build.id, ["building"], "delivered");
  await logEvent(build.id, "Your project is built! Open the live preview or download the code below.");
  await notifyOwner(
    `🎉 ${build.repoName} delivered.\nPreview: ${previewUrl ?? "—"}\nRepo: ${repoUrl(build.repoName!)}\nClient page: ${siteUrl(
      `/projects/${build.id}`,
    )}\nActions minutes used: ${build.actionsMinutes + Math.ceil(payload.minutes)}`,
  );
}

/* ------------------------------------------------- client clarification -- */

export async function submitClientAnswers(build: Build, raw: Record<string, string>) {
  if (build.status !== "clarifying" || !build.claudeQuestions) return false;
  const answered = await normaliseClientAnswers(build.claudeQuestions, raw);
  if (!(await transition(build.id, ["clarifying"], "designing"))) return false;
  await update(build.id, { claudeQuestions: answered });
  await logEvent(build.id, "Thanks for your answers! The design is continuing.");
  await sendAnswersToClaude(build, answered);
  return true;
}

async function sendAnswersToClaude(build: Build, answered: ClaudeQuestion[]) {
  await putFile(
    build.repoName!,
    ".gratia/answers.json",
    `${JSON.stringify(
      answered.map(({ id, question, answer }) => ({ id, question, answer })),
      null,
      2,
    )}\n`,
    "Answers to design questions",
  );
  await requestDispatch(build.id, "design", 0);
}

function parseQuestions(json: string | undefined): ClaudeQuestion[] {
  if (!json) return [];
  try {
    return z.array(claudeQuestionSchema).max(5).parse(JSON.parse(json));
  } catch {
    return [];
  }
}

/** The first paragraphs of a markdown document, flattened for a Telegram caption. */
function summariseMarkdown(markdown: string, max: number) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
