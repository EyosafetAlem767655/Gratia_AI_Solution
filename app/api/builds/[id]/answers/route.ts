import { NextResponse } from "next/server";
import { z } from "zod";
import { loadOwnedBuild } from "@/lib/builds/client";
import { submitClientAnswers } from "@/lib/builds/orchestrator";

export const maxDuration = 60;

const Body = z.object({
  answers: z.record(z.string().max(40), z.string().trim().min(1).max(1500)),
});

/** The client's answers to design questions. They go through Albert before Claude sees them. */
export async function POST(request: Request, ctx: RouteContext<"/api/builds/[id]/answers">) {
  const { id } = await ctx.params;
  const build = await loadOwnedBuild(id);
  if (!build) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please answer every question." }, { status: 400 });
  }

  const open = (build.claudeQuestions ?? []).filter((q) => !q.answer);
  if (open.some((q) => !parsed.data.answers[q.id])) {
    return NextResponse.json({ error: "Please answer every question." }, { status: 400 });
  }

  try {
    const ok = await submitClientAnswers(build, parsed.data.answers);
    if (!ok) {
      return NextResponse.json({ error: "These questions were already answered." }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Client answers failed:", error);
    return NextResponse.json({ error: "Couldn't save your answers. Please try again." }, { status: 502 });
  }
}
