import Link from "next/link";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminShell, Pill } from "@/components/admin/AdminShell";
import { STAGES, ago, listRequests, statusLabel, toneOf, type RequestRow } from "@/lib/admin/data";
import { adminConfigured, isAdmin } from "@/lib/admin/session";
import { ADMIN } from "@/lib/content";

function nameOf(row: RequestRow) {
  return row.title ?? row.problem;
}

function progressOf(row: RequestRow) {
  if (row.totalPhases) return `Phase ${row.currentPhase} of ${row.totalPhases}`;
  return row.buildStatus ? null : `Round ${row.rounds}`;
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  if (!(await isAdmin())) return <AdminLogin configured={adminConfigured()} />;

  let rows: RequestRow[];
  try {
    rows = await listRequests();
  } catch (error) {
    console.error("Admin list failed:", error);
    return (
      <AdminShell>
        <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
        <p role="alert" className="mt-6 rounded-lg bg-[#111] p-5 text-[#b4b4b4]">
          Couldn&apos;t load requests from the database.{" "}
          <Link href="/admin" className="text-white underline underline-offset-4">
            Retry
          </Link>
        </p>
      </AdminShell>
    );
  }

  const { stage } = await searchParams;
  const selected = STAGES.find((s) => s === stage) ?? null;
  const shown = selected ? rows.filter((r) => r.stage === selected) : rows;
  const waiting = rows.filter((r) => r.stage === "review");
  const oldest = waiting.reduce<RequestRow | null>(
    (first, r) => (!first || r.lastActive < first.lastActive ? r : first),
    null,
  );

  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
      <p className="mt-2 max-w-3xl leading-relaxed text-[#b4b4b4]">
        {oldest ? (
          <>
            <span className="font-medium text-[#f2b33d]">{waiting.length} waiting on you in Telegram.</span>{" "}
            Oldest: {nameOf(oldest)}, {ago(oldest.lastActive).toLowerCase()}.
          </>
        ) : (
          "Nothing is waiting on you."
        )}
      </p>

      <nav aria-label="Filter by stage" className="mt-6 flex gap-2 overflow-x-auto lg:grid lg:grid-cols-6 lg:overflow-visible">
        {STAGES.map((s) => {
          const count = rows.filter((r) => r.stage === s).length;
          const active = s === selected;
          return (
            <Link
              key={s}
              href={active ? "/admin" : `/admin?stage=${s}`}
              aria-current={active ? "page" : undefined}
              className={`flex-none rounded-lg px-3 py-2.5 transition-colors lg:flex-auto ${
                s === "review" ? "order-first lg:order-none" : ""
              } ${
                active ? "bg-[#2a2a2a] ring-1 ring-inset ring-white" : "bg-[#111] hover:bg-[#1a1a1a]"
              }`}
            >
              <span className="block whitespace-nowrap text-[13px] text-[#b4b4b4]">{ADMIN.stages[s]}</span>
              <span
                className={`mt-0.5 block text-base font-semibold tabular-nums ${
                  s === "review" && count > 0 ? "text-[#f2b33d]" : ""
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 rounded-lg bg-[#111] px-5 py-2">
        {shown.length === 0 ? (
          <p className="py-6 text-[#b4b4b4]">
            {selected
              ? `Nothing in “${ADMIN.stages[selected]}”.`
              : "No one has talked to Albert yet. Requests appear here as soon as someone starts."}
          </p>
        ) : (
          <table className="w-full table-fixed text-left">
            <caption className="sr-only">Requests started with Albert</caption>
            <thead>
              <tr className="hidden h-10 text-xs text-[#949494] sm:table-row">
                <th scope="col" className="font-normal">Project</th>
                <th scope="col" className="w-48 font-normal">Status</th>
                <th scope="col" className="hidden w-32 font-normal md:table-cell">Progress</th>
                <th scope="col" className="w-28 text-right font-normal">Last active</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id} className="relative border-t border-[#1f1f1f] first:border-t-0 sm:first:border-t hover:bg-[#161616]">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/${row.id}`}
                      className="block truncate font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                    >
                      {nameOf(row)}
                    </Link>
                    <p className="mt-1 truncate text-[13px] text-[#949494]">
                      {row.clientName ? `${row.clientName} · ${row.clientEmail}` : "Anonymous visitor"}
                      {row.risk === "high" && <span className="text-[#e5566f]"> · High injection risk</span>}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3 sm:hidden">
                      <Pill tone={toneOf(row.stage, row.buildStatus)}>{statusLabel(row)}</Pill>
                      <span className="text-[13px] text-[#949494]">{ago(row.lastActive)}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell">
                    <Pill tone={toneOf(row.stage, row.buildStatus)}>{statusLabel(row)}</Pill>
                  </td>
                  <td className="hidden text-[#b4b4b4] md:table-cell">
                    {progressOf(row) ?? <span className="text-[#949494]">—</span>}
                  </td>
                  <td className="hidden text-right tabular-nums text-[#b4b4b4] sm:table-cell">
                    {ago(row.lastActive)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3 text-[13px] text-[#949494]">
        {shown.length} of {rows.length} request{rows.length === 1 ? "" : "s"}
      </p>
    </AdminShell>
  );
}
