import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BuildStatusView } from "@/components/builds/BuildStatusView";
import { SimplePage } from "@/components/SimplePage";
import { currentUser } from "@/lib/auth";
import { clientView, loadOwnedBuild } from "@/lib/builds/client";

export const metadata: Metadata = {
  title: "Project status | Gratia AI Solutions",
  robots: { index: false },
};

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  if (!(await currentUser())) redirect(`/signin?next=/projects/${id}`);

  const build = await loadOwnedBuild(id);
  if (!build) notFound();

  const view = await clientView(build);
  return (
    <SimplePage>
      {/* Dates cross the server/client boundary as strings. */}
      <BuildStatusView initial={JSON.parse(JSON.stringify(view))} />
    </SimplePage>
  );
}
