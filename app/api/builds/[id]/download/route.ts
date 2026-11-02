import { loadOwnedBuild } from "@/lib/builds/client";
import { zipball } from "@/lib/github";

export const maxDuration = 60;

/**
 * The client's code, as a zip of the private repo.
 *
 * The repo stays private and the client never needs a GitHub account: the
 * site fetches the archive with its own token and streams it through, after
 * checking that the signed-in user owns this build.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/builds/[id]/download">) {
  const { id } = await ctx.params;
  const build = await loadOwnedBuild(id);
  if (!build?.repoName || build.currentPhase === 0) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const upstream = await zipball(build.repoName);
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${build.repoName}.zip"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Zip download failed:", error);
    return new Response("Download unavailable right now. Please try again.", { status: 502 });
  }
}
