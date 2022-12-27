import { Modrinth } from "modrinth";

import { Download } from "../types/download";

export async function modrinthDownload(
  minecraftVersion: string,
  modId: string
): Promise<Download> {
  const modrinth = new Modrinth();
  const mod = await modrinth.mod(modId);
  const versions = await mod.versions();
  const candidates = versions.filter(
    (ver) =>
      (ver.type === "release" || ver.type === "beta") &&
      ((ver.game_versions as string[]).includes(minecraftVersion) ||
        // TODO: workaround for MapModCompanion
        (ver.game_versions as string[]).includes("1.19.2")) &&
      (ver.loaders as string[]).includes("paper")
  );
  if (candidates.length === 0) {
    throw new Error(
      `Failed to find a compatible download for ${mod.title} (${mod.id})`
    );
  }

  const version = candidates.reduce((versionA, versionB) =>
    versionA.date_published > versionB.date_published ? versionA : versionB
  );

  const file = version.files.find((f) => f.primary);
  if (!file)
    throw new Error(
      `Failed to find file information for ${mod.title} (${mod.id})`
    );

  return new Download({
    url: new URL(file.url),
    checksum: { type: "sha-512", hash: file.hashes.sha512 },
  });
}

export default modrinthDownload;
