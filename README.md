# Gratia AI Solutions

Marketing site for Gratia AI Solutions, plus **Albert**: an AI interviewer that
turns a visitor's problem into an approved, phased Claude Code build.

## Features

- Marketing pages (Next.js 16, Tailwind 4, GSAP) with the hero film on the landing page
- Portfolio from Neon Postgres, added through an admin-only Telegram bot (`/addproject`, Gemini-structured)
- Contact form relayed to the owner's Telegram
- **Albert** on `/contact`: Gemini interview in rounds of 5 → brief → signup → Telegram approval →
  Claude Code (GitHub Actions) designs, plans and builds in phases → live preview + zip download

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
   - `GEMINI_API_KEY`
   - the Albert / build-pipeline variables below
   - `NEXT_PUBLIC_SITE_URL` — your Vercel URL
5. Deploy, then run migrations: `npm run db:push` (with DATABASE_URL)
6. Register Telegram webhook:

```bash
node --env-file=.env.local scripts/telegram-doctor.mjs --set
```

## Telegram Bot Commands

- `/start` — Help
- `/addproject` — Add a client project (company name → logo → description → testimonial)
- `/builds` — Client builds in progress (status, phase, queue, Actions minutes)
- `/cancel` — Cancel current wizard

## Tech Stack

Next.js 16 · Drizzle · Neon · Vercel Blob · Gemini · Better Auth · GitHub Actions + Claude Code

## Telegram bot

The bot is **webhook-based**. Telegram delivers updates only to a URL you have
registered once with `setWebhook` — until then the bot is completely silent
even though the code and the keys are fine. That is the usual cause of "the bot
is not responding", and the same silence appears if the webhook still points at
a Vercel preview deployment that has since been replaced.

Diagnose before changing anything:

```bash
vercel env pull .env.local                                   # keys live in Vercel
node --env-file=.env.local scripts/telegram-doctor.mjs       # what is wrong
node --env-file=.env.local scripts/telegram-doctor.mjs --set # register/repair
```

The doctor prints which env vars are present, the bot identity, the registered
URL, the queue depth and Telegram's own `last_error_message`, then interprets
the result rather than leaving you to read raw JSON. Re-run it after `--set` to
confirm the fix.

Note that the bot is **admin-only**: it answers `TELEGRAM_ADMIN_ID` and nobody
else. If it replies "restricted to Gratia AI administrators", the webhook is
healthy and that id simply does not match yours (`@userinfobot` will tell you).

## Background video

`public/video/` is generated, not committed by hand:

```bash
node scripts/fetch-assets.mjs
```

It downloads the source clip once into a gitignored `.cache/`, then produces a
**lossless remux** for desktop (`-c:v copy`, so the pixels are untouched — only
`+faststart` is added so playback can begin before the whole file arrives), a
smaller rendition for phones, and a poster frame.

## Albert & the build pipeline

```
/contact → Albert (Gemini, 5 questions a round, ≤6 rounds) → brief + injection check
        → visitor signs up (Google or email+password) → "Send to the Gratia team"
Telegram ① [Approve] → private repo from template in GITHUB_BUILD_ORG, .gratia/brief.json
        → Actions: Claude DESIGN → docs/ARCHITECTURE.md + rendered diagram
          (Claude may ask questions → Albert answers from the interview, or asks the client)
Telegram ② diagram photo [Approve design] [Request changes]
        → Actions: Claude PLAN → .gratia/plan.json (phases + minutes) → client sees "≈ N hours"
Telegram ③ [Start build] → one Actions run per phase, chained automatically
        → each phase: commit, `vercel deploy --prod`, client page updates
        → usage limit hit → paused, retried automatically (status-page polls, daily cron, [Resume])
Client /projects/[id]: status, timeline, phase k/N, hours left, live preview, zip download
```

**Why the visitor can't prompt Claude:** their text only ever reaches Gemini (wrapped as data).
Claude receives a fixed prompt from the workflow and reads only the Albert-written, length-capped
brief, which the owner has already read, along with a safety verdict (a Gemini check plus regex patterns).
Claude runs with no web tools and a short Bash allow-list, and never sees the Vercel token or the callback secret.
Callbacks are HMAC-signed. One run at a time across all clients, because every build shares one subscription.

### One-time setup

1. **Database:** `npm run db:push` creates the new tables in the `gratia` schema
   (account/session/user/verification, albert_conversations, builds, build_events).
2. **Auth:**
   - Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.
   - For Google, create an OAuth client with redirect URI `<site>/api/auth/callback/google`
     and set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
3. **GitHub org** (free), e.g. `gratia-builds`:
   - Push `builder-template/` as `gratia-builds/gratia-build-template`, then tick *Settings → Template repository*.
   - Install the Claude GitHub App on the org (https://github.com/apps/claude), for all repositories.
   - Add these org secrets (*Settings → Secrets → Actions*, all repositories):
     - `CLAUDE_CODE_OAUTH_TOKEN`: run `claude setup-token` locally. This uses your Claude Pro/Max subscription.
     - `VERCEL_TOKEN`: from vercel.com/account/tokens. Optionally add an org **variable** `VERCEL_SCOPE` (team slug).
     - `BUILD_CALLBACK_SECRET`: the same value as the site env var.
     - `GRATIA_CALLBACK_URL`: `https://<site>/api/builds/callback`
   - Create a fine-grained PAT with resource owner = the org, all repositories, and these permissions:
     Administration RW, Contents RW, Actions RW, Metadata R. Set it as `GITHUB_TOKEN` on the site.
4. **Site env:** `GITHUB_BUILD_ORG`, `GITHUB_TEMPLATE_REPO`, `BUILD_CALLBACK_SECRET`, `CRON_SECRET`, `GEMINI_API_KEY`.
5. **Telegram:** re-run `node --env-file=.env.local scripts/telegram-doctor.mjs --set` once, so the
   webhook receives button taps (`callback_query`).

### Owner console (`/admin`)

Set `ADMIN_PASSWORD` on Vercel and redeploy. `/admin` lists every conversation with Albert, including
unfinished and anonymous ones, and opens each one's brief, safety check, interview and build state.
It is read-only: approvals still happen in Telegram. Sessions last 12 hours, and changing the password
logs every session out. With no password set, nobody can log in.

### Limits to know

- **Claude subscription:** builds pause when the usage window runs out and resume on their own.
  The hours estimate includes a buffer for this.
- **GitHub Actions:** private repos get 2,000 free minutes a month. `/builds` shows the minutes each build has used.
- **Vercel Hobby** doesn't allow commercial use. Client previews will eventually need a Pro team (`VERCEL_SCOPE`).
- The output is a strong first version. Review it before handing it over.
