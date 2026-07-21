# Gratia AI Solutions

Creative 3D marketing website with Telegram portfolio bot, OpenAI content generation, Neon Postgres, and Vercel deployment.

## Features

- Immersive 3D scroll experience (React Three Fiber) with nature/wood branding
- Dynamic projects gallery powered by Neon Postgres
- Admin-only Telegram bot (`/addproject`) to submit client work
- OpenAI GPT-4o + DALL-E 3 for structuring, images, and 3D scene configs
- Contact form with email notification

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in env vars (DATABASE_URL from Neon, etc.)
npm run db:push
npm run dev
```

## Deployment (Vercel)

1. Push to GitHub and import in [Vercel](https://vercel.com)
2. Add **Neon** integration → auto-sets `DATABASE_URL`
3. Add **Vercel Blob** storage → sets `BLOB_READ_WRITE_TOKEN`
4. Set environment variables:
   - `TELEGRAM_BOT_TOKEN` — from [@BotFather](https://t.me/BotFather)
   - `TELEGRAM_ADMIN_ID` — your numeric ID from [@userinfobot](https://t.me/userinfobot)
   - `OPENAI_API_KEY`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_SITE_URL` — your Vercel URL
5. Deploy, then run migrations: `npm run db:push` (with DATABASE_URL)
6. Register Telegram webhook:

```bash
TELEGRAM_BOT_TOKEN=xxx NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app node scripts/setup-webhook.mjs
```

## Telegram Bot Commands

- `/start` — Help
- `/addproject` — Add a client project (company name → logo → description → testimonial)
- `/cancel` — Cancel current wizard

## Tech Stack

Next.js 16 · React Three Fiber · Drizzle · Neon · Vercel Blob · OpenAI · Resend
