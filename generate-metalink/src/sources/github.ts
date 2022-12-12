import { Octokit } from "@octokit/rest";

import { Download } from "../types/download";

export async function githubDownload(
  _minecraftVersion: string,
  id: string
): Promise<Download> {
  // XXX: Ignoring minecraftVersion

  const [owner, repo] = id.split("/", 2);
  if (owner == null || repo == null) {
    throw new Error(`Invalid GitHub owner/repo: ${JSON.stringify(id)}`);
  }

  const octokit = new Octokit();
  const rel = await octokit.rest.repos.getLatestRelease({ owner, repo });
  const assets = await octokit.rest.repos.listReleaseAssets({
    owner,
    repo,
    release_id: rel.data.id,
  });
  const asset = assets.data.find((a) => a.name.match(/\.jar$/));
  if (asset == null) {
    throw new Error(
      `Failed to find a .jar asset for github:${JSON.stringify(id)}`
    );
  }

  return new Download({
    url: new URL(asset.browser_download_url),
  });
}

export default githubDownload;
