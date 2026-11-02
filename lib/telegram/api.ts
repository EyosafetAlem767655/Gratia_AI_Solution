const TELEGRAM_API = "https://api.telegram.org/bot";

function getToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }
  return token;
}

export type InlineKeyboard = Array<Array<{ text: string; callback_data?: string; url?: string }>>;

/** Telegram's hard limit is 4096 characters; longer messages are rejected outright. */
const MAX_TEXT = 4000;
const MAX_CAPTION = 1000;

async function call(method: string, payload: Record<string, unknown>) {
  const token = getToken();
  const response = await fetch(`${TELEGRAM_API}${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram ${method} failed: ${body}`);
  }
  return response.json();
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  options?: { parse_mode?: "HTML" | "Markdown"; buttons?: InlineKeyboard },
) {
  await call("sendMessage", {
    chat_id: chatId,
    text: truncate(text, MAX_TEXT),
    parse_mode: options?.parse_mode,
    reply_markup: options?.buttons ? { inline_keyboard: options.buttons } : undefined,
    link_preview_options: { is_disabled: true },
  });
}

export async function sendTelegramPhoto(
  chatId: number,
  photoUrl: string,
  caption: string,
  buttons?: InlineKeyboard,
) {
  await call("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption: truncate(caption, MAX_CAPTION),
    reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
  });
}

/** Stops the spinner on the tapped button, optionally with a short toast. */
export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await call("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

/** Removes the buttons from a message, so a decision cannot be tapped twice. */
export async function clearButtons(chatId: number, messageId: number) {
  await call("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: [] },
  });
}

/** The owner's chat. Every pipeline notification goes here. */
export function adminChatId() {
  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (!adminId) {
    throw new Error("TELEGRAM_ADMIN_ID is not configured");
  }
  return Number(adminId);
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export async function downloadTelegramFile(
  fileId: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const token = getToken();

  const fileMetaResponse = await fetch(
    `${TELEGRAM_API}${token}/getFile?file_id=${fileId}`,
  );
  const fileMeta = (await fileMetaResponse.json()) as {
    ok: boolean;
    result?: { file_path: string };
  };

  if (!fileMeta.ok || !fileMeta.result?.file_path) {
    throw new Error("Failed to resolve Telegram file path");
  }

  const fileResponse = await fetch(
    `https://api.telegram.org/file/bot${token}/${fileMeta.result.file_path}`,
  );

  if (!fileResponse.ok) {
    throw new Error("Failed to download Telegram file");
  }

  const contentType =
    fileResponse.headers.get("content-type") ?? "image/png";
  const buffer = Buffer.from(await fileResponse.arrayBuffer());

  return { buffer, contentType };
}

export function isAdmin(userId: number) {
  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (!adminId) {
    return false;
  }
  return String(userId) === adminId;
}
