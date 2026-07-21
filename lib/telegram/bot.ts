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

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  if (!message?.from) {
    return;
  }

  const chatId = message.chat.id;
  const userId = message.from.id;

  if (!isAdmin(userId)) {
    await sendTelegramMessage(
      chatId,
      "This bot is restricted to Gratia AI administrators.",
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
