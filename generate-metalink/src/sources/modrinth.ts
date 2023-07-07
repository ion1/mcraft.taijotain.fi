import { ModrinthV2Client } from "@xmcl/modrinth";

import { Download } from "../types/download";

const modrinth = new ModrinthV2Client();

export async function modrinthDownload(
  minecraftVersion: string,
  modId: string
): Promise<Download> {
  const mod = await modrinth.getProject(modId);
  const versions = await modrinth.getProjectVersions(modId);
  const candidates = versions.filter(
    (ver) =>
      (ver.version_type === "release" || ver.version_type === "beta") &&
      (ver.game_versions.includes(minecraftVersion) ||
        // TODO: workaround for MapModCompanion
        ver.game_versions.includes("1.19.2")) &&
      ver.loaders.includes("paper")
  );
  if (candidates.length === 0) {
    throw new Error(
      `Failed to find a compatible download for ${mod.title} (${mod.id})`
    );
  }

  const version = candidates.reduce((versionA, versionB) =>
    versionA.date_published > versionB.date_published ? versionA : versionB
  );

  const file = version.files.find((f) => (f as { primary?: boolean }).primary);
  if (!file) {
    throw new Error(
      `Failed to find file information for ${mod.title} (${mod.id})` +
        `, got ${JSON.stringify(version.files)}`
    );
  }

  const { sha512 } = file.hashes;
  if (!sha512) {
    throw new Error(
      `Failed to find a SHA-512 hash for ${mod.title} (${mod.id})` +
        `, got ${JSON.stringify(file.hashes)}`
    );
  }

  return new Download({
    url: new URL(file.url),
    checksum: { type: "sha-512", hash: sha512 },
  });
}

export default modrinthDownload;
