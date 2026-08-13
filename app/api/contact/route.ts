import { NextResponse } from "next/server";
import { z } from "zod";
import { sendTelegramMessage } from "@/lib/telegram/api";

/**
 * Contact enquiries.
 *
 * There is no email provider configured on this project, and adding one means
 * another paid key. But a Telegram bot the owner already reads is right there,
 * so an enquiry is relayed straight into that chat — instant, no new
 * dependency, no deliverability problems, nothing to expire.
 *
 * The page also shows the address as a plain `mailto:` link. That matters: if
 * the bot token is ever wrong or Telegram is down, a visitor can still make
 * contact without this route working at all.
 */

const Enquiry = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("That email doesn't look right").max(160),
  message: z.string().trim().min(10, "Tell us a little more").max(2000),
  // Honeypot. Real visitors never see this field, so anything in it is a bot.
  //
  // Deliberately permissive: constraining it to `.max(0)` here would make a
  // filled honeypot fail *validation*, which returns a 400 carrying a message
  // about a field the visitor cannot see — telling the bot author exactly what
  // tripped them. It is checked after parsing instead, and answered with a
  // plain success.
  company: z.string().max(200).optional(),
});

/**
 * Crude in-memory rate limit, keyed by IP.
 *
 * This is a public route that pushes to the owner's phone, so it needs *some*
 * brake. Being per-instance memory it resets on cold start and does not span
 * serverless instances — it will not stop a determined attacker, only casual
 * flooding. A shared store would be the real fix if this ever gets abused.
 */
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  HITS.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many messages. Try again later, or email us directly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = Enquiry.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 400 },
    );
  }

  // Honeypot filled — accept silently so the bot believes it succeeded and
  // does not retry with a different shape.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (!adminId) {
    console.error("Contact form: TELEGRAM_ADMIN_ID is not configured.");
    return NextResponse.json(
      { error: "Messaging is unavailable right now — please email us directly." },
      { status: 503 },
    );
  }

  const { name, email, message } = parsed.data;

  try {
    await sendTelegramMessage(
      Number(adminId),
      `New enquiry from the site\n\nFrom: ${name}\nEmail: ${email}\n\n${message}`,
    );
  } catch (error) {
    // Never surface the internal reason to the visitor, but do log it —
    // a bad token here is otherwise invisible until someone complains.
    console.error("Contact form: Telegram relay failed:", error);
    return NextResponse.json(
      { error: "Couldn't send that — please email us directly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
