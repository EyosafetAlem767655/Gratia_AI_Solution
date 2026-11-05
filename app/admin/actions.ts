"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminConfigured,
  endAdminSession,
  passwordMatches,
  startAdminSession,
} from "@/lib/admin/session";
import { createRateLimit, ipFrom } from "@/lib/rate-limit";

export type LoginState = { error: string | null };

// One password guards every client's request, so guesses must stay slow.
const rateLimited = createRateLimit(8, 15 * 60 * 1000);

export async function login(_previous: LoginState, form: FormData): Promise<LoginState> {
  if (!adminConfigured()) {
    return { error: "ADMIN_PASSWORD is not set on this deployment." };
  }
  if (rateLimited(ipFrom(await headers()))) {
    return { error: "Too many attempts. Try again in 15 minutes." };
  }
  if (!passwordMatches(String(form.get("password") ?? ""))) {
    return { error: "Wrong password." };
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin");
}
