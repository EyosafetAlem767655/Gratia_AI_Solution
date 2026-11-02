"use client";

import { useEffect, useState } from "react";
import { Check, Download, ExternalLink, Loader2 } from "lucide-react";
import type { ClientBuildView } from "@/lib/builds/client";
import { BUILD_STATUS } from "@/lib/content";

type View = Omit<ClientBuildView, "createdAt" | "events"> & {
  createdAt: string;
  events: { message: string; createdAt: string }[];
};

/** States in which nothing more will happen, so polling can stop. */
const FINAL = new Set(["delivered", "rejected"]);
const POLL_MS = 15_000;

const field =
  "w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 outline-none ring-1 ring-inset ring-white/15 transition-colors focus:bg-white/15 focus:ring-white/40";

export function BuildStatusView({ initial }: { initial: View }) {
  const [view, setView] = useState(initial);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (FINAL.has(view.status)) return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/builds/${view.id}`, { cache: "no-store" });
        if (response.ok) setView(await response.json());
      } catch {
        // Offline for a moment; the next tick will catch up.
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [view.id, view.status]);

  async function sendAnswers(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/builds/${view.id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Couldn't save your answers.");
        return;
      }
      setAnswers({});
      setView({ ...view, status: "designing", questions: [] });
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const status = BUILD_STATUS[view.status] ?? { label: view.status, detail: "" };
  const active = !FINAL.has(view.status) && view.status !== "failed" && view.status !== "clarifying";

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-white/70">Project status</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{view.title}</h1>
      {view.summary && <p className="mt-3 max-w-2xl leading-relaxed text-white/70">{view.summary}</p>}

      <div className="glass mt-8 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          {active ? (
            <Loader2 className="h-5 w-5 animate-spin text-white/80" />
          ) : view.status === "delivered" ? (
            <Check className="h-5 w-5" />
          ) : null}
          <p className="text-xl font-semibold">{status.label}</p>
        </div>
        <p className="mt-2 text-sm text-white/70">{status.detail}</p>

        {view.totalPhases > 0 && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-white/60">
              <span>
                Phase {Math.min(view.currentPhase + (view.status === "building" ? 1 : 0), view.totalPhases)} of{" "}
                {view.totalPhases}
              </span>
              {view.hoursLeft !== null && view.status !== "delivered" && (
                <span>About {view.hoursLeft} hour{view.hoursLeft === 1 ? "" : "s"} left</span>
              )}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-700"
                style={{ width: `${(view.currentPhase / view.totalPhases) * 100}%` }}
              />
            </div>
            <ol className="mt-4 flex flex-col gap-1.5 text-sm">
              {view.phases.map((p) => (
                <li key={p.number} className={p.number <= view.currentPhase ? "text-white" : "text-white/50"}>
                  {p.number <= view.currentPhase ? "✓" : `${p.number}.`} {p.title}
                </li>
              ))}
            </ol>
          </div>
        )}

        {view.etaHours !== null && view.totalPhases === 0 && view.hoursLeft !== null && (
          <p className="mt-4 text-sm text-white/70">Estimated build time: about {view.hoursLeft} hours.</p>
        )}

        {(view.previewUrl || view.canDownload) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {view.previewUrl && (
              <a
                href={view.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cta inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
              >
                Open live preview <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {view.canDownload && (
              <a
                href={`/api/builds/${view.id}/download`}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-medium ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/15"
              >
                Download the code <Download className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>

      {view.questions.length > 0 && (
        <form onSubmit={sendAnswers} className="glass mt-6 flex flex-col gap-4 rounded-2xl p-6">
          <p className="font-medium">Albert has a few more questions</p>
          {view.questions.map((q, i) => (
            <label key={q.id} className="flex flex-col gap-2 text-sm">
              <span>
                <span className="mr-2 text-white/50">{i + 1}.</span>
                {q.question}
              </span>
              <textarea
                required
                rows={2}
                maxLength={1500}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                className={`${field} resize-none`}
              />
            </label>
          ))}
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={busy} className="btn-cta self-start rounded-full px-6 py-3 text-sm font-medium disabled:opacity-60">
            {busy ? "Sending…" : "Send answers"}
          </button>
        </form>
      )}

      {view.events.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-white/60">Timeline</p>
          <ol className="flex flex-col gap-3 border-l border-white/15 pl-5">
            {[...view.events].reverse().map((e, i) => (
              <li key={i} className="text-sm">
                <p className="text-white/85">{e.message}</p>
                <p className="mt-0.5 text-xs text-white/45">
                  {new Date(e.createdAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
