"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const field =
  "w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 outline-none ring-1 ring-inset ring-white/15 transition-colors focus:bg-white/15 focus:ring-white/40";

export function SignInForm({
  next,
  initialMode,
  google,
}: {
  next: string;
  initialMode: "signin" | "signup";
  google: boolean;
}) {
  const [mode, setMode] = useState(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    setBusy(true);
    setError(null);

    const result =
      mode === "signup"
        ? await authClient.signUp.email({ name: data.name, email: data.email, password: data.password })
        : await authClient.signIn.email({ email: data.email, password: data.password });

    if (result.error) {
      setBusy(false);
      setError(result.error.message ?? "That didn't work. Please check your details.");
      return;
    }
    // A full navigation, so every server component sees the new session cookie.
    window.location.assign(next);
  }

  async function withGoogle() {
    setBusy(true);
    setError(null);
    const result = await authClient.signIn.social({ provider: "google", callbackURL: next });
    if (result?.error) {
      setBusy(false);
      setError(result.error.message ?? "Google sign-in failed.");
    }
  }

  const signup = mode === "signup";

  return (
    <div className="glass rounded-2xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        {signup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-white/70">
        {signup
          ? "We use your account to send you updates and deliver your project."
          : "Sign in to see your projects."}
      </p>

      {google && (
        <>
          <button
            type="button"
            onClick={withGoogle}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/40">
            <span className="h-px flex-1 bg-white/15" /> or <span className="h-px flex-1 bg-white/15" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className={`flex flex-col gap-3 ${google ? "" : "mt-6"}`}>
        {signup && (
          <>
            <label htmlFor="name" className="sr-only">Your name</label>
            <input id="name" name="name" required maxLength={80} autoComplete="name" placeholder="Your name" className={field} />
          </>
        )}
        <label htmlFor="email" className="sr-only">Email</label>
        <input id="email" name="email" type="email" required maxLength={160} autoComplete="email" placeholder="Email" className={field} />
        <label htmlFor="password" className="sr-only">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete={signup ? "new-password" : "current-password"}
          placeholder={signup ? "Password (8+ characters)" : "Password"}
          className={field}
        />

        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="btn-cta mt-1 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {signup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-white/60">
        {signup ? "Already have an account? " : "New here? "}
        <button
          type="button"
          onClick={() => {
            setMode(signup ? "signin" : "signup");
            setError(null);
          }}
          className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
        >
          {signup ? "Sign in" : "Create an account"}
        </button>
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}
