import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { guard, nextRound, writeBrief } from "@/lib/albert/albert";
import { loadOwnedConversation, publicState } from "@/lib/albert/store";
import { answersSchema, type AlbertAnswers, type AlbertQuestion } from "@/lib/albert/types";
import { requireDb } from "@/lib/db";
import { albertConversations } from "@/lib/db/schema";
import { clientIp, createRateLimit } from "@/lib/rate-limit";

// Finishing an interview is three Gemini calls in a row: next round, brief, guard.
export const maxDuration = 90;

const rateLimited = createRateLimit(40, 60 * 60 * 1000);

const Body = z.object({
  conversationId: z.string().uuid(),
  answers: answersSchema,
});

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Malformed answers." }, { status: 400 });
  }

  const conversation = await loadOwnedConversation(parsed.data.conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  if (conversation.status !== "interviewing") {
    return NextResponse.json(await publicState(conversation));
  }

  const transcript = conversation.transcript;
  const current = transcript.rounds.at(-1);
  if (!current || current.answers) {
    return NextResponse.json({ error: "No questions are waiting for answers." }, { status: 409 });
  }

  const problem = validate(current.questions, parsed.data.answers);
  if (problem) {
    return NextResponse.json({ error: problem }, { status: 400 });
  }

  // Keep only answers to questions that were actually asked, and only options
  // that were actually offered — anything else is the browser making things up.
  current.answers = Object.fromEntries(
    current.questions.map((q) => {
      const a = parsed.data.answers[q.id];
      return [
        q.id,
        {
          choices: a.choices.filter((c) => q.options.includes(c)),
          other: q.allowOther ? a.other : "",
          text: q.type === "text" ? a.text : "",
        },
      ];
    }),
  );

  try {
    const round = await nextRound(transcript);
    const database = requireDb();

    if (!round.done) {
      transcript.rounds.push({ message: round.message, questions: round.questions, answers: null });
      const [saved] = await database
        .update(albertConversations)
        .set({ transcript, updatedAt: new Date() })
        .where(eq(albertConversations.id, conversation.id))
        .returning();
      return NextResponse.json(await publicState(saved));
    }

    const brief = await writeBrief(transcript);
    const verdict = await guard(transcript, brief);
    const [saved] = await database
      .update(albertConversations)
      .set({ transcript, brief, guardVerdict: verdict, status: "complete", updatedAt: new Date() })
      .where(eq(albertConversations.id, conversation.id))
      .returning();
    return NextResponse.json(await publicState(saved));
  } catch (error) {
    console.error("Albert answer failed:", error);
    return NextResponse.json(
      { error: "Albert is having trouble right now. Please press Continue again." },
      { status: 502 },
    );
  }
}

function validate(questions: AlbertQuestion[], answers: AlbertAnswers) {
  for (const q of questions) {
    const a = answers[q.id];
    const empty =
      !a || (q.type === "text" ? !a.text : a.choices.length === 0 && !a.other);
    if (empty) return `Please answer: “${q.text}”`;
    if (q.type === "single" && a.choices.length + (a.other ? 1 : 0) > 1) {
      return `Please pick just one answer for: “${q.text}”`;
    }
  }
  return null;
}
