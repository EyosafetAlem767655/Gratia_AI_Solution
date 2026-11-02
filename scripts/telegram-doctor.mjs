/**
 * Diagnose and repair the Telegram bot.
 *
 *   node --env-file=.env.local scripts/telegram-doctor.mjs
 *   node --env-file=.env.local scripts/telegram-doctor.mjs --set
 *   node --env-file=.env.local scripts/telegram-doctor.mjs --set https://example.com
 *   node --env-file=.env.local scripts/telegram-doctor.mjs --delete
 *
 * The keys live in Vercel, so pull them down first:
 *
 *   vercel env pull .env.local
 *
 * Why this exists: a Telegram webhook bot is silent by design until someone
 * calls `setWebhook` once. Telegram will not push updates to a URL it has
 * never been told about, and it reports nothing when that is the case — the
 * bot simply never hears anything. The same silence appears when the webhook
 * *was* registered but points at a deployment that has since gone away, which
 * is easy to do with Vercel preview URLs. `getWebhookInfo` distinguishes the
 * two in one call, so always look before setting.
 */

const RESET = "\x1b[0m";
const paint = (code, s) => `\x1b[${code}m${s}${RESET}`;
const red = (s) => paint(31, s);
const green = (s) => paint(32, s);
const yellow = (s) => paint(33, s);
const dim = (s) => paint(90, s);

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error(red("TELEGRAM_BOT_TOKEN is not set."));
  console.error("Pull the Vercel environment first:\n");
  console.error("  vercel env pull .env.local");
  console.error("  node --env-file=.env.local scripts/telegram-doctor.mjs\n");
  process.exit(1);
}

const api = async (method, params) => {
  const url = new URL(`https://api.telegram.org/bot${token}/${method}`);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  const response = await fetch(url);
  const body = await response.json();
  if (!body.ok) throw new Error(`${method}: ${body.description ?? response.status}`);
  return body.result;
};

const args = process.argv.slice(2);
const wants = (flag) => args.includes(flag);
const valueAfter = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : undefined;
};

/** Presence only — never print a secret from a script someone may paste. */
function reportEnv() {
  console.log("Environment");
  const keys = [
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_ADMIN_ID",
    "NEXT_PUBLIC_SITE_URL",
    "DATABASE_URL",
    "BLOB_READ_WRITE_TOKEN",
    "OPENAI_API_KEY",
  ];
  for (const key of keys) {
    const present = Boolean(process.env[key]);
    // The site URL is not a secret and is the value most likely to be wrong,
    // so it is the one thing worth echoing back.
    const detail = present && key === "NEXT_PUBLIC_SITE_URL" ? dim(`  ${process.env[key]}`) : "";
    console.log(`  ${present ? green("set    ") : red("MISSING")} ${key}${detail}`);
  }
  console.log();
}

async function diagnose() {
  reportEnv();

  const me = await api("getMe");
  console.log(`Bot        ${green("@" + me.username)} ${dim(`(${me.first_name}, id ${me.id})`)}\n`);

  const info = await api("getWebhookInfo");
  console.log("Webhook");
  console.log(`  url                   ${info.url ? green(info.url) : red("(none registered)")}`);
  console.log(`  pending updates       ${info.pending_update_count}`);
  if (info.last_error_message) {
    const when = new Date(info.last_error_date * 1000).toISOString();
    console.log(`  last error            ${red(info.last_error_message)} ${dim(when)}`);
  }
  if (info.ip_address) console.log(`  ip                    ${dim(info.ip_address)}`);
  console.log();

  // Interpretation. The raw fields above are only useful if you already know
  // what they mean; this is the part that saves the next person an hour.
  console.log("Diagnosis");
  if (!info.url) {
    console.log(red("  The webhook has never been registered."));
    console.log("  Telegram only delivers updates to a URL you register, so the bot");
    console.log("  cannot hear anything at all. This is the usual cause of total silence.\n");
    console.log(yellow("  Fix:  node --env-file=.env.local scripts/telegram-doctor.mjs --set"));
    return;
  }

  if (info.last_error_message) {
    console.log(red("  Registered, but Telegram cannot deliver to it."));
    const m = info.last_error_message.toLowerCase();
    if (m.includes("404")) {
      console.log("  A 404 means the URL is wrong or that deployment no longer exists —");
      console.log("  most often a Vercel preview URL that has since been superseded.");
      console.log(yellow("\n  Fix:  --set https://your-production-domain"));
    } else if (m.includes("401") || m.includes("403")) {
      console.log("  Auth is rejecting Telegram. Check for Vercel Deployment Protection");
      console.log("  on the production deployment — it will block the webhook POST.");
    } else if (m.includes("ssl") || m.includes("certificate")) {
      console.log("  TLS problem. Telegram requires a valid certificate on port 443.");
    } else if (m.includes("timeout") || m.includes("gateway")) {
      console.log("  The endpoint is too slow. vercel.json allows 120s, but Telegram");
      console.log("  itself times out far sooner — acknowledge fast, work afterwards.");
    }
    return;
  }

  if (info.pending_update_count > 0) {
    console.log(yellow(`  ${info.pending_update_count} updates queued and undelivered.`));
    console.log("  The endpoint is reachable but not draining the queue — check the");
    console.log("  function logs for a crash inside handleTelegramUpdate.");
    return;
  }

  console.log(green("  Webhook is healthy."));
  console.log("  If the bot still seems silent, it is answering and you are not seeing it:");
  console.log(`  the bot is admin-only, and TELEGRAM_ADMIN_ID is currently ${
    process.env.TELEGRAM_ADMIN_ID ? dim(process.env.TELEGRAM_ADMIN_ID) : red("unset")
  }.`);
  console.log("  Message @userinfobot to confirm your numeric id matches.");
}

async function setWebhook() {
  const base = valueAfter("--set") ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) {
    console.error(red("No URL. Pass one, or set NEXT_PUBLIC_SITE_URL."));
    console.error("  node --env-file=.env.local scripts/telegram-doctor.mjs --set https://example.com");
    process.exit(1);
  }
  if (!base.startsWith("https://")) {
    // Worth failing loudly: Telegram silently refuses plain HTTP, and the
    // resulting symptom is again "the bot does nothing".
    console.error(red("Telegram requires HTTPS. Refusing to register " + base));
    process.exit(1);
  }

  const url = `${base.replace(/\/$/, "")}/api/telegram/webhook`;
  console.log(`Registering ${url} ...`);

  // Clear the backlog. Without this, every message sent while the webhook was
  // broken is delivered at once the moment it starts working.
  // allowed_updates is explicit: Telegram otherwise keeps whatever list an
  // earlier setWebhook chose, and the build pipeline's Approve/Reject buttons
  // arrive as callback_query updates.
  await api("setWebhook", {
    url,
    drop_pending_updates: "true",
    allowed_updates: JSON.stringify(["message", "callback_query"]),
  });

  const info = await api("getWebhookInfo");
  console.log(info.url === url ? green("\nRegistered.\n") : red("\nDid not take.\n"));
  await diagnose();
}

async function deleteWebhook() {
  await api("deleteWebhook", { drop_pending_updates: "true" });
  console.log(green("Webhook removed."));
}

try {
  if (wants("--delete")) await deleteWebhook();
  else if (wants("--set")) await setWebhook();
  else await diagnose();
} catch (error) {
  console.error(red(`\n${error.message}`));
  if (String(error.message).includes("401")) {
    console.error("A 401 from getMe means the bot token itself is wrong or revoked.");
  }
  process.exit(1);
}
