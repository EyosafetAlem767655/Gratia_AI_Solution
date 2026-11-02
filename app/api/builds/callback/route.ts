import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { callbackSchema, handleCallback } from "@/lib/builds/orchestrator";

export const maxDuration = 120;

/**
 * Where each GitHub Actions run reports back.
 *
 * Signed with HMAC-SHA256 over the raw body using BUILD_CALLBACK_SECRET, the
 * same value stored as an org secret in GitHub. Without a valid signature
 * nothing is parsed, let alone acted on: this route can advance a build and
 * upload files, so an unsigned request must be indistinguishable from noise.
 */
export async function POST(request: Request) {
  const secret = process.env.BUILD_CALLBACK_SECRET;
  if (!secret) {
    console.error("Build callback: BUILD_CALLBACK_SECRET is not configured.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const raw = await request.text();
  const given = request.headers.get("x-gratia-signature") ?? "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const valid =
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!valid) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let payload;
  try {
    payload = callbackSchema.parse(JSON.parse(raw));
  } catch (error) {
    console.error("Build callback: invalid payload", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await handleCallback(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Build callback failed:", error);
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}
