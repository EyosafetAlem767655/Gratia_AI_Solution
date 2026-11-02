import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loadOwnedConversation } from "@/lib/albert/store";
import { currentUser } from "@/lib/auth";
import { submitBuild } from "@/lib/builds/orchestrator";
import { requireDb } from "@/lib/db";
import { albertConversations } from "@/lib/db/schema";

const Body = z.object({ conversationId: z.string().uuid() });

/**
 * Sends a finished interview to the owner for approval.
 *
 * Signing up is required here, before approval, not after: an approved build
 * for someone we cannot contact is wasted work, and an account per request is
 * a natural brake on spam.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign up to send your request." }, { status: 401 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const conversation = await loadOwnedConversation(parsed.data.conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  if (conversation.userId && conversation.userId !== user.id) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  if (conversation.status !== "complete" || !conversation.brief) {
    return NextResponse.json({ error: "Please finish talking with Albert first." }, { status: 409 });
  }

  // Claim the conversation atomically, so a double click submits once.
  const claimed = await requireDb()
    .update(albertConversations)
    .set({ status: "submitted", userId: user.id, updatedAt: new Date() })
    .where(
      and(eq(albertConversations.id, conversation.id), eq(albertConversations.status, "complete")),
    )
    .returning();
  if (claimed.length === 0) {
    return NextResponse.json({ error: "This request was already sent." }, { status: 409 });
  }

  const build = await submitBuild(
    { ...claimed[0], brief: conversation.brief },
    { id: user.id, name: user.name, email: user.email },
  );
  return NextResponse.json({ buildId: build.id });
}
