import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { requireDb } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema";

/**
 * Accounts: Google sign-in, or email + password.
 *
 * Built lazily. `requireDb()` throws when no connection string is set, and a
 * module-level `betterAuth(...)` would therefore break `next build` on any
 * machine without database env vars, for every route that imports this file.
 *
 * Google is only registered when its keys are present, so a local setup with
 * nothing but a database still has working email sign-in.
 *
 * There is no email provider on this project, so addresses are not verified.
 * That is acceptable here because every account's request is read by a human
 * before anything happens.
 */

function createAuth() {
  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    // Unset = inferred from each request, so the site works on its custom
    // domain and on *.vercel.app alike. Set BETTER_AUTH_URL to pin it (Google
    // sign-in builds its redirect URI from this).
    baseURL: process.env.BETTER_AUTH_URL,
    // Better Auth rejects sign-ins whose Origin it does not recognise.
    trustedOrigins: trustedOrigins(),
    database: drizzleAdapter(requireDb(), {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
    },
    socialProviders:
      googleId && googleSecret
        ? { google: { clientId: googleId, clientSecret: googleSecret } }
        : {},
    // Lets server actions set the session cookie. Must stay last.
    plugins: [nextCookies()],
  });
}

function trustedOrigins() {
  const env = process.env;
  const origins = [
    env.BETTER_AUTH_URL,
    env.NEXT_PUBLIC_SITE_URL,
    "https://gratiaaisolutions.com",
    "https://www.gratiaaisolutions.com",
    env.VERCEL_URL && `https://${env.VERCEL_URL}`,
    env.VERCEL_BRANCH_URL && `https://${env.VERCEL_BRANCH_URL}`,
    env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`,
    env.NODE_ENV !== "production" && "http://localhost:3000",
  ];
  return origins.filter((o): o is string => Boolean(o));
}

let instance: ReturnType<typeof createAuth> | null = null;

export function getAuth() {
  instance ??= createAuth();
  return instance;
}

export function googleEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** The signed-in user for the current request, or null. */
export async function currentUser() {
  const result = await getAuth().api.getSession({ headers: await headers() });
  return result?.user ?? null;
}
