/**
 * The four GitHub operations the build pipeline needs, over plain REST.
 *
 * Auth is a fine-grained personal access token scoped to the build org only
 * (GITHUB_BUILD_ORG) — never to the repo this site lives in — with:
 * Administration: write (create repos), Contents: write, Actions: write,
 * Metadata: read.
 *
 * Client repos are generated from a template repo (GITHUB_TEMPLATE_REPO, e.g.
 * `gratia-builds/gratia-build-template`) that carries the workflow and the
 * CLAUDE.md rules. Its source lives in builder-template/ in this repo.
 */

const API = "https://api.github.com";
const WORKFLOW = "gratia.yml";

function config() {
  const token = process.env.GITHUB_TOKEN;
  const org = process.env.GITHUB_BUILD_ORG;
  const template = process.env.GITHUB_TEMPLATE_REPO;
  if (!token || !org || !template) {
    throw new Error("GITHUB_TOKEN, GITHUB_BUILD_ORG and GITHUB_TEMPLATE_REPO must all be configured");
  }
  return { token, org, template };
}

export function githubConfigured() {
  return Boolean(
    process.env.GITHUB_TOKEN && process.env.GITHUB_BUILD_ORG && process.env.GITHUB_TEMPLATE_REPO,
  );
}

async function gh(path: string, init: RequestInit = {}) {
  const { token } = config();
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
}

async function ok(response: Response, what: string) {
  if (!response.ok) {
    throw new Error(`GitHub ${what} failed (${response.status}): ${await response.text()}`);
  }
  return response;
}

export function repoUrl(repoName: string, path?: string) {
  const { org } = config();
  return path
    ? `https://github.com/${org}/${repoName}/blob/main/${path}`
    : `https://github.com/${org}/${repoName}`;
}

/**
 * Creates a private repo from the template and waits until it is usable.
 *
 * Generation is asynchronous on GitHub's side: the call returns before the
 * template's files exist, and a file write or workflow dispatch made in that
 * gap fails. So poll for the workflow file before returning.
 */
export async function createRepoFromTemplate(name: string, description: string) {
  const { org, template } = config();
  // Safe to call again after a partial failure: an existing repo is reused.
  const exists = await gh(`/repos/${org}/${name}`);
  if (!exists.ok) {
    await ok(
      await gh(`/repos/${template}/generate`, {
        method: "POST",
        body: JSON.stringify({ owner: org, name, description, private: true }),
      }),
      "repo generation",
    );
  }

  for (let attempt = 0; attempt < 20; attempt++) {
    const probe = await gh(`/repos/${org}/${name}/contents/.github/workflows/${WORKFLOW}`);
    if (probe.ok) return;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Repo ${org}/${name} was created but its files never appeared`);
}

/** Creates or overwrites one file on main. */
export async function putFile(repoName: string, path: string, content: string, message: string) {
  const { org } = config();
  const existing = await gh(`/repos/${org}/${repoName}/contents/${path}`);
  const sha = existing.ok ? ((await existing.json()) as { sha: string }).sha : undefined;

  await ok(
    await gh(`/repos/${org}/${repoName}/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: Buffer.from(content, "utf8").toString("base64"),
        sha,
        branch: "main",
      }),
    }),
    `write ${path}`,
  );
}

export async function dispatchWorkflow(
  repoName: string,
  inputs: { stage: string; phase: string; build_id: string },
) {
  const { org } = config();
  await ok(
    await gh(`/repos/${org}/${repoName}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: "POST",
      body: JSON.stringify({ ref: "main", inputs }),
    }),
    "workflow dispatch",
  );
}

/** The repo as a zip, for the client's download button. Follows GitHub's redirect to codeload. */
export async function zipball(repoName: string) {
  const { org } = config();
  return ok(await gh(`/repos/${org}/${repoName}/zipball/main`), "zip download");
}
