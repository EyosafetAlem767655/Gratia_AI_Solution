import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminShell, Panel, Pill } from "@/components/admin/AdminShell";
import { describeAnswer } from "@/lib/albert/albert";
import { ago, getRequest, statusLabel, toneOf } from "@/lib/admin/data";
import { isAdmin } from "@/lib/admin/session";
import { githubConfigured, repoUrl } from "@/lib/github";

const NEXT_STEP: Record<string, string> = {
  awaiting_approval: "Read the brief, then approve or reject it in Telegram.",
  design_review: "Review the design, then approve it or ask for changes in Telegram.",
  plan_review: "Review the plan, then start the build in Telegram.",
  failed: "The last run failed. Retry it from the Telegram message.",
  clarifying: "The client has questions to answer on their status page.",
};

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl>
      {rows.map(([label, value]) => (
        <div key={label} className="flex min-h-8 items-baseline justify-between gap-4 py-1">
          <dt className="flex-none text-[#b4b4b4]">{label}</dt>
          <dd className="min-w-0 break-words text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Items({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-5">
      <h3 className="font-medium">{title}</h3>
      <ul className="mt-1.5 flex flex-col gap-1 leading-relaxed text-[#b4b4b4]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const Dash = () => <span className="text-[#949494]">—</span>;

export default async function AdminRequestPage({ params }: PageProps<"/admin/[id]">) {
  if (!(await isAdmin())) redirect("/admin");

  const { id } = await params;
  const request = /^[0-9a-f-]{36}$/i.test(id) ? await getRequest(id) : null;
  if (!request) notFound();

  const { conversation, build, client, events, stage } = request;
  const { brief, guardVerdict: verdict, transcript } = conversation;
  const status = { conversationStatus: conversation.status, buildStatus: build?.status ?? null };
  const nextStep = build && NEXT_STEP[build.status];
  const repo = build?.repoName && githubConfigured() ? repoUrl(build.repoName) : null;

  return (
    <AdminShell>
      <Link href="/admin" className="inline-flex h-8 items-center gap-1.5 text-[#b4b4b4] transition-colors hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> All requests
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight">
          {brief?.title ?? "Interview in progress"}
        </h1>
        <Pill tone={toneOf(stage, build?.status ?? null)}>{statusLabel(status)}</Pill>
      </div>
      {nextStep && <p className="mt-2 text-[#b4b4b4]">{nextStep}</p>}

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Brief">
            {brief ? (
              <>
                <p className="max-w-[75ch] leading-relaxed">{brief.summary}</p>
                <p className="mt-3 max-w-[75ch] leading-relaxed text-[#b4b4b4]">{brief.problem}</p>
                {brief.features.length > 0 && (
                  <div className="mt-5">
                    <h3 className="font-medium">Features</h3>
                    <ul className="mt-1.5">
                      {brief.features.map((f) => (
                        <li key={f.name} className="flex items-baseline gap-3 py-1.5">
                          <span className="w-12 flex-none text-[13px] capitalize text-[#949494]">{f.priority}</span>
                          <span className="min-w-0 leading-relaxed">
                            {f.name} <span className="text-[#b4b4b4]">— {f.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Items title="Users" items={brief.users} />
                <Items title="Goals" items={brief.goals} />
                <Items title="Data and integrations" items={brief.dataAndIntegrations} />
                <Items title="Constraints" items={brief.constraints} />
                <Items title="Success criteria" items={brief.successCriteria} />
                <Items title="Open questions" items={brief.openQuestions} />
              </>
            ) : (
              <p className="text-[#b4b4b4]">Albert writes the brief when the interview finishes.</p>
            )}
          </Panel>

          {build?.designMd && (
            <Panel title="System design">
              {build.diagramUrl && (
                <Image
                  src={build.diagramUrl}
                  alt="Architecture diagram"
                  width={1800}
                  height={1000}
                  className="h-auto w-full rounded bg-white"
                />
              )}
              <details className={build.diagramUrl ? "mt-3" : ""}>
                <summary className="cursor-pointer text-[#b4b4b4] hover:text-white">Full design document</summary>
                <pre className="mt-3 whitespace-pre-wrap break-words font-sans leading-relaxed text-[#b4b4b4]">
                  {build.designMd}
                </pre>
              </details>
            </Panel>
          )}

          {build?.plan && (
            <Panel title="Build plan">
              <ol>
                {build.plan.phases.map((p) => (
                  <li key={p.number} className="flex items-baseline justify-between gap-4 py-1.5">
                    <span className={p.number <= build.currentPhase ? "text-[#949494]" : ""}>
                      {p.number}. {p.title}
                    </span>
                    <span className="flex-none tabular-nums text-[#b4b4b4]">{p.estimatedMinutes} min</span>
                  </li>
                ))}
              </ol>
            </Panel>
          )}

          <Panel title="Interview">
            <h3 className="font-medium">Their problem, in their words</h3>
            <p className="mt-1.5 max-w-[75ch] whitespace-pre-wrap break-words leading-relaxed text-[#b4b4b4]">
              {transcript.problem}
            </p>
            {transcript.rounds.map((round, i) => (
              <div key={i} className="mt-6">
                <h3 className="font-medium">Round {i + 1}</h3>
                <dl className="mt-1.5">
                  {round.questions.map((q) => (
                    <div key={q.id} className="py-1.5">
                      <dt className="max-w-[75ch] text-[#b4b4b4]">{q.text}</dt>
                      <dd className="mt-0.5 max-w-[75ch] whitespace-pre-wrap break-words">
                        {round.answers ? (
                          describeAnswer(q, round.answers[q.id])
                        ) : (
                          <span className="text-[#949494]">Not answered yet</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Client">
            {client ? (
              <Rows
                rows={[
                  ["Name", client.name],
                  ["Email", <a key="email" href={`mailto:${client.email}`} className="underline underline-offset-4">{client.email}</a>],
                  ["Joined", ago(client.createdAt)],
                ]}
              />
            ) : (
              <p className="text-[#b4b4b4]">Anonymous until they sign up to send this.</p>
            )}
          </Panel>

          <Panel title="Progress">
            <Rows
              rows={[
                ["Started", ago(conversation.createdAt)],
                ["Interview rounds", <span key="rounds" className="tabular-nums">{transcript.rounds.length}</span>],
                ["Build phase", build?.totalPhases ? <span key="phase" className="tabular-nums">{build.currentPhase} of {build.totalPhases}</span> : <Dash key="phase" />],
                ["Estimate", build?.etaHours ? <span key="eta" className="tabular-nums">{build.etaHours} h</span> : <Dash key="eta" />],
                ["Actions used", build ? <span key="mins" className="tabular-nums">{build.actionsMinutes} min</span> : <Dash key="mins" />],
                ["Preview", build?.previewUrl ? <a key="preview" href={build.previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">Open <ExternalLink className="h-3.5 w-3.5" /></a> : <Dash key="preview" />],
                ["Repo", repo ? <a key="repo" href={repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">Open <ExternalLink className="h-3.5 w-3.5" /></a> : <Dash key="repo" />],
              ]}
            />
          </Panel>

          <Panel title="Safety check">
            {verdict ? (
              <>
                <Pill tone={verdict.risk === "high" ? "bad" : verdict.risk === "low" ? "waiting" : "neutral"}>
                  {verdict.risk === "none" ? "No injection found" : `${verdict.risk === "high" ? "High" : "Low"} injection risk`}
                </Pill>
                {verdict.reasons.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1 break-words leading-relaxed text-[#b4b4b4]">
                    {verdict.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="text-[#b4b4b4]">Runs when the interview finishes.</p>
            )}
          </Panel>

          {events.length > 0 && (
            <Panel title="Timeline">
              <ol className="flex flex-col gap-3">
                {events.map((event) => (
                  <li key={event.id}>
                    <p className="leading-relaxed">{event.message}</p>
                    <p className="mt-0.5 text-[13px] text-[#949494]">{ago(event.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </Panel>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
