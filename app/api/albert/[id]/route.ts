import { NextResponse } from "next/server";
import { loadOwnedConversation, publicState } from "@/lib/albert/store";

/** Lets the chat pick up where it left off, e.g. after the sign-in redirect. */
export async function GET(_request: Request, ctx: RouteContext<"/api/albert/[id]">) {
  const { id } = await ctx.params;
  const conversation = /^[0-9a-f-]{36}$/i.test(id) ? await loadOwnedConversation(id) : null;
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  return NextResponse.json(await publicState(conversation));
}
