import { NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/lib/telegram/bot";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const update = await request.json();
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Gratia AI Telegram webhook is active",
  });
}
