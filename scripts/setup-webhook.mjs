/**
 * Register Telegram webhook after deploying to Vercel.
 * Usage: TELEGRAM_BOT_TOKEN=xxx NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app node scripts/setup-webhook.mjs
 */

const token = process.env.TELEGRAM_BOT_TOKEN;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!token || !siteUrl) {
  console.error("Set TELEGRAM_BOT_TOKEN and NEXT_PUBLIC_SITE_URL");
  process.exit(1);
}

const webhookUrl = `${siteUrl.replace(/\/$/, "")}/api/telegram/webhook`;
const res = await fetch(
  `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`,
);
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
