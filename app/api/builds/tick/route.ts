import { NextResponse } from "next/server";
import { drainQueue } from "@/lib/builds/orchestrator";

/**
 * Daily backstop for the build queue (see vercel.json `crons`).
 *
 * Paused builds normally resume when their status page polls or the owner
 * taps Resume; this catches the case where nobody is watching. Vercel sends
 * `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await drainQueue();
  return NextResponse.json({ ok: true });
}
