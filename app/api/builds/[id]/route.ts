import { NextResponse } from "next/server";
import { clientView, loadOwnedBuild } from "@/lib/builds/client";
import { drainQueue } from "@/lib/builds/orchestrator";

/**
 * Polled by the client's status page.
 *
 * Each poll also nudges the queue. That is what makes a build paused by
 * Claude's usage limit resume on its own: there is no minute-level scheduler
 * on Vercel's free plan, but there is a client watching their build.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/builds/[id]">) {
  const { id } = await ctx.params;
  const build = await loadOwnedBuild(id);
  if (!build) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await drainQueue();
  } catch (error) {
    console.error("drainQueue from status poll failed:", error);
  }

  return NextResponse.json(await clientView((await loadOwnedBuild(id)) ?? build));
}
