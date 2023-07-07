import { SpigetAPI } from "spiget-api";

import { Download } from "../types/download";

export async function spigetDownload(
  minecraftVersion: string,
  modId: number,
): Promise<Download> {
  const spiget = new SpigetAPI("generate-metalink");
  const resource = await spiget.getResource(modId);
  if (!resource) throw new Error(`Failed to get resource for ${modId}`);

  const testedVersions = (resource.testedVersions || []).map((v) =>
    v.toString(),
  );
  const truncatedVersion = minecraftVersion.replace(
    /^([0-9]+.[0-9]+)\..*/,
    "$1",
  );
  if (
    !testedVersions.includes(minecraftVersion) &&
    !testedVersions.includes(truncatedVersion)
  ) {
    throw new Error(
      `Incompatible resource for ${resource.name} (${resource.id})`,
    );
  }

  const url = await resource.getDownloadUrl();

  // XXX: Workaround for https://github.com/VeguiDev/spiget-api/issues/1
  if (!url && resource.external) {
    const resourceCoerced = resource as { file?: { externalUrl?: string } };
    const extUrl = resourceCoerced.file?.externalUrl;
    if (extUrl != null) {
      return new Download({ url: new URL(extUrl) });
    }
  }

  if (!url)
    throw new Error(`Failed to get URL for ${resource.name} (${resource.id})`);

  return new Download({
    url: new URL(url.url),
    name: url.name,
  });
}

export default spigetDownload;
