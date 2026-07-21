const TELEGRAM_API = "https://api.telegram.org/bot";

function getToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }
  return token;
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  options?: { parse_mode?: "HTML" | "Markdown" },
) {
  const token = getToken();
  const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed: ${body}`);
  }
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
