"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";
import { Logo } from "@/components/ui/Logo";

const initial: LoginState = { error: null };

export function AdminLogin({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm rounded-lg bg-[#111] p-6">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Admin</h1>

        {configured ? (
          <form action={action} className="mt-5 flex flex-col gap-3">
            <label htmlFor="admin-password" className="text-[#b4b4b4]">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              aria-describedby={state.error ? "admin-error" : undefined}
              className="h-11 rounded-md bg-[#2a2a2a] px-3 text-white outline-none ring-1 ring-inset ring-[#444] focus:ring-white"
            />
            {state.error && (
              <p id="admin-error" role="alert" className="text-[#e5566f]">
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="mt-1 h-11 rounded-full bg-white font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Checking…" : "Log in"}
            </button>
          </form>
        ) : (
          <p className="mt-3 leading-relaxed text-[#b4b4b4]">
            Add <code className="text-white">ADMIN_PASSWORD</code> to the Vercel environment
            variables and redeploy. Until then nobody can log in.
          </p>
        )}
      </div>
    </main>
  );
}
