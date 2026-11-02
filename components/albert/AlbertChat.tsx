"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { AlbertState } from "@/lib/albert/store";
import { ALBERT } from "@/lib/content";
import { QuestionCard, emptyDraft, isAnswered, type DraftAnswer } from "./QuestionCard";

/**
 * The interview.
 *
 * All state that matters lives on the server; the browser keeps only the
 * conversation id (localStorage), so the chat survives a refresh and the
 * round trip through sign-up.
 */

const STORAGE_KEY = "albert_conversation";

const field =
  "w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 outline-none ring-1 ring-inset ring-white/15 transition-colors focus:bg-white/15 focus:ring-white/40";

export function AlbertChat() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [state, setState] = useState<AlbertState | null>(null);
  const [problem, setProblem] = useState("");
  const [drafts, setDrafts] = useState<Record<string, DraftAnswer>>({});
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pick up an existing conversation, e.g. after returning from sign-up.
  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY);
    const restore = id
      ? fetch(`/api/albert/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((restored: AlbertState | null) => {
            if (restored) setState(restored);
            else localStorage.removeItem(STORAGE_KEY);
          })
          .catch(() => {})
      : Promise.resolve();
    restore.finally(() => setRestoring(false));
  }, []);

  async function post(url: string, body: unknown) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return null;
      }
      return data;
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function start(event: React.FormEvent) {
    event.preventDefault();
    const next: AlbertState | null = await post("/api/albert/start", { problem });
    if (!next) return;
    localStorage.setItem(STORAGE_KEY, next.id);
    setDrafts({});
    setState(next);
  }

  async function answer(event: React.FormEvent) {
    event.preventDefault();
    if (!state) return;
    const missing = state.questions.findIndex((q) => !isAnswered(q, drafts[q.id] ?? emptyDraft()));
    if (missing >= 0) {
      setError(`Please answer question ${missing + 1}.`);
      return;
    }
    const answers = Object.fromEntries(
      state.questions.map((q) => {
        const d = drafts[q.id] ?? emptyDraft();
        return [q.id, { choices: d.choices, other: d.otherOn ? d.other : "", text: d.text }];
      }),
    );
    const next: AlbertState | null = await post("/api/albert/answer", {
      conversationId: state.id,
      answers,
    });
    if (!next) return;
    setDrafts({});
    setState(next);
    document.getElementById("albert")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit() {
    if (!state) return;
    const result: { buildId: string } | null = await post("/api/albert/submit", {
      conversationId: state.id,
    });
    if (!result) return;
    localStorage.removeItem(STORAGE_KEY);
    router.push(`/projects/${result.buildId}`);
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setState(null);
    setProblem("");
    setDrafts({});
    setError(null);
  }

  if (restoring) {
    return <Panel><Thinking /></Panel>;
  }

  /* -- 1. The opening question -------------------------------------------- */
  if (!state) {
    return (
      <Panel>
        <AlbertSays>{ALBERT.greeting}</AlbertSays>
        <form onSubmit={start} className="mt-5 flex flex-col gap-3">
          <label htmlFor="albert-problem" className="sr-only">
            Describe your problem
          </label>
          <textarea
            id="albert-problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            minLength={20}
            maxLength={3000}
            rows={6}
            required
            placeholder={ALBERT.placeholder}
            className={`${field} resize-y`}
          />
          <Footer error={error}>
            <button type="submit" disabled={busy} className="btn-cta flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium disabled:opacity-60">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {ALBERT.thinking}</> : <>{ALBERT.start} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </Footer>
        </form>
      </Panel>
    );
  }

  /* -- 2. A round of questions -------------------------------------------- */
  if (state.status === "interviewing") {
    return (
      <Panel>
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
            Round {state.round}
          </span>
          <ResetButton onClick={reset} />
        </div>
        {state.message && <AlbertSays>{state.message}</AlbertSays>}
        <form onSubmit={answer} className="mt-5 flex flex-col gap-3">
          {state.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              index={i + 1}
              question={q}
              value={drafts[q.id] ?? emptyDraft()}
              onChange={(next) => setDrafts((d) => ({ ...d, [q.id]: next }))}
            />
          ))}
          <Footer error={error}>
            <button type="submit" disabled={busy} className="btn-cta flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium disabled:opacity-60">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {ALBERT.thinking}</> : <>{ALBERT.continue} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </Footer>
        </form>
      </Panel>
    );
  }

  /* -- 3. Finished: sign up, then send ------------------------------------ */
  if (state.status === "submitted") {
    return (
      <Panel>
        <AlbertSays>Your request has been sent to our team.</AlbertSays>
        <div className="mt-5 flex flex-wrap gap-3">
          {state.buildId && (
            <Link href={`/projects/${state.buildId}`} className="btn-cta rounded-full px-6 py-3 text-sm font-medium">
              See your project status
            </Link>
          )}
          <ResetButton onClick={reset} label={ALBERT.startOver} />
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <AlbertSays>{ALBERT.doneHeadline}</AlbertSays>
      {state.brief && (
        <div className="mt-5 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-inset ring-white/10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">Your request</p>
          <h3 className="mt-2 text-lg font-semibold">{state.brief.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{state.brief.summary}</p>
        </div>
      )}

      {session?.user ? (
        <Footer error={error}>
          <button type="button" onClick={submit} disabled={busy} className="btn-cta flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {ALBERT.submitting}</> : <>{ALBERT.submit} <ArrowRight className="h-4 w-4" /></>}
          </button>
        </Footer>
      ) : (
        <div className="mt-5">
          <p className="text-sm leading-relaxed text-white/75">{ALBERT.signupNote}</p>
          <Link
            href={`/signin?mode=signup&next=${encodeURIComponent("/contact#albert")}`}
            className="btn-cta mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
          >
            {ALBERT.signupCta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="glass rounded-2xl p-5 sm:p-7">{children}</div>;
}

function AlbertSays({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black">
        <Sparkles className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">Albert</p>
        <p className="mt-1 text-base leading-relaxed text-white sm:text-lg">{children}</p>
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <p className="flex items-center gap-2 text-sm text-white/70">
      <Loader2 className="h-4 w-4 animate-spin" /> {ALBERT.thinking}
    </p>
  );
}

function Footer({ error, children }: { error: string | null; children: React.ReactNode }) {
  return (
    <div className="mt-2 flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      <div>{children}</div>
    </div>
  );
}

function ResetButton({ onClick, label = "Start over" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white"
    >
      <RotateCcw className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
