import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SimplePage } from "@/components/SimplePage";
import { currentUser } from "@/lib/auth";
import { listOwnBuilds } from "@/lib/builds/client";
import { BUILD_STATUS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Your projects | Gratia AI Solutions",
  robots: { index: false },
};

export default async function ProjectsPage() {
  const user = await currentUser();
  if (!user) redirect("/signin?next=/projects");

  const rows = await listOwnBuilds(user.id);

  return (
    <SimplePage>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-white/70">Your projects</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Hello, {user.name.split(" ")[0]}</h1>

      {rows.length === 0 ? (
        <div className="glass mt-8 rounded-2xl p-6">
          <p className="text-white/75">You haven&apos;t sent us a project yet.</p>
          <Link href="/contact#albert" className="btn-cta mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium">
            Talk to Albert <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/projects/${row.id}`}
                className="glass flex items-center justify-between gap-4 rounded-2xl p-5 transition-colors hover:bg-white/15"
              >
                <div>
                  <p className="font-medium">{row.brief?.title ?? "Your project"}</p>
                  <p className="mt-1 text-sm text-white/60">
                    {BUILD_STATUS[row.status]?.label ?? row.status} ·{" "}
                    {row.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/60" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SimplePage>
  );
}
