import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The owner's login for /admin: one password, from ADMIN_PASSWORD.
 *
 * Separate from client accounts on purpose. Better Auth holds anyone who signs
 * up; being able to read every client's request must not hang off that table.
 *
 * Fails closed: with no ADMIN_PASSWORD set, nothing can log in.
 *
 * The cookie is `<expiry>.<signature>`. The signing key is derived from the
 * password, so changing ADMIN_PASSWORD logs every existing session out.
 */

const COOKIE = "gratia_admin";
const SESSION_SECONDS = 12 * 60 * 60;

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function signingKey() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash("sha256")
    .update(`gratia-admin:${password}:${process.env.BETTER_AUTH_SECRET ?? ""}`)
    .digest();
}

function sign(key: Buffer, expires: number) {
  return createHmac("sha256", key).update(String(expires)).digest();
}

/** Hashing first gives equal-length inputs, which timingSafeEqual requires. */
export function passwordMatches(attempt: string) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(attempt), digest(password));
}

export async function startAdminSession() {
  const key = signingKey();
  if (!key) throw new Error("ADMIN_PASSWORD is not configured");

  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  (await cookies()).set(COOKIE, `${expires}.${sign(key, expires).toString("hex")}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SESSION_SECONDS,
  });
}

export async function endAdminSession() {
  (await cookies()).set(COOKIE, "", { path: "/admin", maxAge: 0 });
}

export async function isAdmin() {
  // cookies() comes first even when no password is set: it is what makes /admin
  // render per request. Returning before it would let a build made without
  // ADMIN_PASSWORD freeze the "not configured" page into a static file.
  const value = (await cookies()).get(COOKIE)?.value ?? "";
  const key = signingKey();
  if (!key) return false;

  const [expires, signature] = value.split(".");
  const expiry = Number(expires);
  if (!signature || !Number.isInteger(expiry) || expiry * 1000 <= Date.now()) return false;

  const given = Buffer.from(signature, "hex");
  const expected = sign(key, expiry);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
