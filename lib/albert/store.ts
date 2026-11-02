import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { albertConversations, builds, type AlbertConversation } from "@/lib/db/schema";

/**
 * Who may read or continue a conversation.
 *
 * Before signup the only proof of ownership is an httpOnly cookie holding a
 * random token, set when the interview starts. After signup the user id also
 * counts, so the conversation survives a different browser.
 */

const COOKIE = "albert_anon";

export async function anonToken({ create }: { create: boolean }) {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing || !create) return existing ?? null;

  const token = randomBytes(24).toString("base64url");
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

export async function loadOwnedConversation(id: string) {
  const [conversation] = await requireDb()
    .select()
    .from(albertConversations)
    .where(eq(albertConversations.id, id))
    .limit(1);
  if (!conversation) return null;

  const token = await anonToken({ create: false });
  if (token && token === conversation.anonToken) return conversation;

  const user = await currentUser();
  if (user && conversation.userId === user.id) return conversation;
  return null;
}

/** What the browser is allowed to see: never the guard verdict, never internals. */
export async function publicState(conversation: AlbertConversation) {
  const rounds = conversation.transcript.rounds;
  const current = rounds.at(-1);
  const pending = current && !current.answers ? current : null;

  let buildId: string | null = null;
  if (conversation.status === "submitted") {
    const [build] = await requireDb()
      .select({ id: builds.id })
      .from(builds)
      .where(eq(builds.conversationId, conversation.id))
      .limit(1);
    buildId = build?.id ?? null;
  }

  return {
    id: conversation.id,
    status: conversation.status,
    round: rounds.length,
    message: pending?.message ?? null,
    questions: pending?.questions ?? [],
    brief: conversation.brief
      ? { title: conversation.brief.title, summary: conversation.brief.summary }
      : null,
    buildId,
  };
}
export type AlbertState = Awaited<ReturnType<typeof publicState>>;
