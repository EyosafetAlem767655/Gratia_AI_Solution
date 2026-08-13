import { eq } from "drizzle-orm";
import { processAndSaveProject } from "@/lib/ai/process";
import { uploadBuffer } from "@/lib/blob";
import { requireDb } from "@/lib/db";
import { telegramSessions } from "@/lib/db/schema";
import type { TelegramPartialData } from "@/lib/types";
import {
  downloadTelegramFile,
  isAdmin,
  sendTelegramMessage,
} from "@/lib/telegram/api";

type TelegramUpdate = {
  message?: {
    message_id: number;
    chat: { id: number };
    from?: { id: number };
    text?: string;
    photo?: Array<{ file_id: string; file_size?: number }>;
    document?: { file_id: string; mime_type?: string };
  };
};

const STEPS = {
  IDLE: 0,
  COMPANY_NAME: 1,
  LOGO: 2,
  DESCRIPTION: 3,
  TESTIMONIAL: 4,
} as const;

/**
 * Entry point for the webhook.
 *
 * Everything below this is allowed to throw. The route that calls us swallows
 * exceptions and returns 200 — which it must, or Telegram retries the update
 * forever — but that also means an unhandled failure anywhere in the wizard
 * reaches the operator as *nothing at all*. A DB session lookup failing on a
 * bad DATABASE_URL is indistinguishable from the bot being offline.
 *
 * So: catch here, and say so in the chat. A visible error is worth far more
 * than a clean stack trace in a log nobody is tailing.
 */
export async function handleTelegramUpdate(update: TelegramUpdate) {
  const chatId = update.message?.chat.id;
  try {
    await route(update);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Telegram handler failed:", error);
    if (chatId === undefined) return;
    try {
      await sendTelegramMessage(chatId, `Something broke: ${detail}\n\nTry /cancel, then start again.`);
    } catch {
      // The failure was Telegram itself (bad token, network). Nothing further
      // to try — the console line above is all we get.
    }
  }
}

async function route(update: TelegramUpdate) {
  const message = update.message;
  if (!message?.from) {
    return;
  }

  const chatId = message.chat.id;
  const userId = message.from.id;

  if (!isAdmin(userId)) {
    // The rejection carries the sender's own numeric id.
    //
    // This bot has exactly one operator, and the only way to configure
    // TELEGRAM_ADMIN_ID is to know that number — which otherwise means going
    // and finding @userinfobot. Worse, a misconfigured id looks identical to a
    // dead bot from the outside: you message it, and it refuses you with no
    // clue why. Telling people the id they are being judged on turns a dead
    // end into a one-step fix, and a person's own Telegram id is not a secret
    // from themselves.
    const configured = process.env.TELEGRAM_ADMIN_ID;
    const hint =
      !configured || configured === "123456789"
        ? "\n\nTELEGRAM_ADMIN_ID is not configured yet — it is still the placeholder."
        : "";
    await sendTelegramMessage(
      chatId,
      `This bot is restricted to Gratia AI administrators.\n\nYour Telegram ID is ${userId}. Set TELEGRAM_ADMIN_ID to this value to gain access.${hint}`,
    );
    return;
  }

  const text = message.text?.trim();

  if (text === "/start") {
    await sendTelegramMessage(
      chatId,
      "Welcome to Gratia AI Portfolio Bot.\n\nCommands:\n/addproject — Add a new client project\n/cancel — Cancel current wizard",
    );
    return;
  }

  if (text === "/cancel") {
    await clearSession(chatId);
    await sendTelegramMessage(chatId, "Wizard cancelled.");
    return;
  }

  if (text === "/addproject") {
    await setSession(chatId, STEPS.COMPANY_NAME, {});
    await sendTelegramMessage(chatId, "What is the company name?");
    return;
  }

  const session = await getSession(chatId);
  if (!session || session.step === STEPS.IDLE) {
    if (text?.startsWith("/")) {
      await sendTelegramMessage(chatId, "Unknown command. Try /addproject");
    }
    return;
  }

  const partial = (session.partialData ?? {}) as TelegramPartialData;

  if (session.step === STEPS.COMPANY_NAME) {
    if (!text) {
      await sendTelegramMessage(chatId, "Please send the company name as text.");
      return;
    }
    partial.companyName = text;
    await setSession(chatId, STEPS.LOGO, partial);
    await sendTelegramMessage(chatId, "Send the company logo (photo).");
    return;
  }

  if (session.step === STEPS.LOGO) {
    const fileId =
      message.photo?.[message.photo.length - 1]?.file_id ??
      (message.document?.mime_type?.startsWith("image/")
        ? message.document.file_id
        : undefined);

    if (!fileId) {
      await sendTelegramMessage(
        chatId,
        "Please send a logo image (photo or image document).",
      );
      return;
    }

    partial.logoFileId = fileId;
    await setSession(chatId, STEPS.DESCRIPTION, partial);
    await sendTelegramMessage(chatId, "What did we build for them?");
    return;
  }

  if (session.step === STEPS.DESCRIPTION) {
    if (!text) {
      await sendTelegramMessage(
        chatId,
        "Please describe what we built (text message).",
      );
      return;
    }
    partial.description = text;
    await setSession(chatId, STEPS.TESTIMONIAL, partial);
    await sendTelegramMessage(chatId, "Paste their testimonial.");
    return;
  }

  if (session.step === STEPS.TESTIMONIAL) {
    if (!text) {
      await sendTelegramMessage(chatId, "Please send the testimonial as text.");
      return;
    }
    partial.testimonial = text;

    await clearSession(chatId);
    await sendTelegramMessage(
      chatId,
      "Processing with AI... This may take up to a minute.",
    );

    try {
      if (!partial.companyName || !partial.logoFileId) {
        throw new Error("Missing required project data");
      }

      const { buffer, contentType } = await downloadTelegramFile(
        partial.logoFileId,
      );
      const logoUrl = await uploadBuffer(
        `logos/${slugify(partial.companyName)}-${Date.now()}`,
        buffer,
        contentType,
      );

      const { project } = await processAndSaveProject({
        companyName: partial.companyName,
        companyLogoUrl: logoUrl,
        description: partial.description!,
        testimonial: partial.testimonial,
      });

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-site.vercel.app";
      await sendTelegramMessage(
        chatId,
        `Project live!\n\n${project.companyName} has been added.\nView: ${siteUrl}/#projects`,
      );
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Unknown error occurred";
      await sendTelegramMessage(
        chatId,
        `Failed to process project: ${msg}\n\nTry /addproject again.`,
      );
    }
  }
}

async function getSession(chatId: number) {
  const database = requireDb();
  const rows = await database
    .select()
    .from(telegramSessions)
    .where(eq(telegramSessions.chatId, chatId))
    .limit(1);
  return rows[0] ?? null;
}

async function setSession(
  chatId: number,
  step: number,
  partialData: TelegramPartialData,
) {
  const database = requireDb();
  await database
    .insert(telegramSessions)
    .values({
      chatId,
      step,
      partialData: partialData as Record<string, string>,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: telegramSessions.chatId,
      set: {
        step,
        partialData: partialData as Record<string, string>,
        updatedAt: new Date(),
      },
    });
}

async function clearSession(chatId: number) {
  const database = requireDb();
  await database
    .delete(telegramSessions)
    .where(eq(telegramSessions.chatId, chatId));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
