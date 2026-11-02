import { NextResponse } from "next/server";
import { z } from "zod";
import { nextRound } from "@/lib/albert/albert";
import { anonToken, publicState } from "@/lib/albert/store";
import { requireDb } from "@/lib/db";
import { albertConversations } from "@/lib/db/schema";
import { clientIp, createRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

// Each interview costs Gemini quota on a free tier; a few per hour is plenty
// for a real visitor.
const rateLimited = createRateLimit(5, 60 * 60 * 1000);

const Body = z.object({
  problem: z
    .string()
    .trim()
    .min(20, "Tell Albert a little more — a few sentences is perfect.")
    .max(3000, "That's a lot! Please keep it under 3,000 characters."),
});

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { error: "You've started several conversations already. Please try again later." },
      { status: 429 },
    );
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please describe your problem." },
      { status: 400 },
    );
  }

  try {
    const transcript = { problem: parsed.data.problem, rounds: [] as never[] };
    const round = await nextRound(transcript);
    if (round.done) throw new Error("Albert ended the interview before it began");

    const token = (await anonToken({ create: true }))!;
    const [conversation] = await requireDb()
      .insert(albertConversations)
      .values({
        anonToken: token,
        transcript: {
          problem: transcript.problem,
          rounds: [{ message: round.message, questions: round.questions, answers: null }],
        },
      })
      .returning();

    return NextResponse.json(await publicState(conversation));
  } catch (error) {
    console.error("Albert start failed:", error);
    return NextResponse.json(
      { error: "Albert is having trouble right now. Please try again in a minute." },
      { status: 502 },
    );
  }
}
