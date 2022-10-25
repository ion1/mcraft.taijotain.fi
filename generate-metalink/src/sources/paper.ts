import { PaperAPI } from "papermc-api/dist/class/PaperAPI";

import { Download } from "../types/download";

export async function paperDownload(
  minecraftVersion: string
): Promise<Download> {
  const paper = await PaperAPI.project("paper");
  if (!paper) throw new Error(`PaperAPI.project("paper") failed`);
  const version = await paper.getVersion(minecraftVersion);
  const build = await version.getBuild("latest");
  const url = build.getDownloadUrl();
  const sha256sum = build.downloads["application"]?.sha256;
  if (!sha256sum) throw new Error(`Failed to find checksum for Paper`);

  return new Download({
    url: new URL(url),
    checksum: { type: "sha-256", hash: sha256sum },
  });
}

export default paperDownload;
