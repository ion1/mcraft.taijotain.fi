import { create } from "xmlbuilder2";

export type Format = "pretty" | "minimal" | "base64";

// https://aria2.github.io/manual/en/html/README.html#metalink
export type ChecksumType =
  | "md5"
  | "sha-1"
  | "sha-224"
  | "sha-256"
  | "sha-384"
  | "sha-512";

export class Download {
  url: URL;
  name?: string;
  checksum?: { type: ChecksumType; hash: string };

  constructor(opts: {
    url: URL;
    name?: string;
    checksum?: { type: ChecksumType; hash: string };
  }) {
    this.url = opts.url;

    const { pathname } = this.url;
    const filename = pathname.slice(Math.max(0, pathname.lastIndexOf("/") + 1));
    this.name = opts.name ?? filename;

    this.checksum = opts.checksum;
  }

  metalink(format: Format = "pretty"): string {
    const root = create({ version: "1.0" })
      .ele("metalink", { xmlns: "urn:ietf:params:xml:ns:metalink" })
      .ele("file", { name: this.name })
      .ele("url")
      .txt(this.url.toString())
      .up();
    if (this.checksum) {
      root
        .ele("hash", { type: this.checksum.type })
        .txt(this.checksum.hash)
        .up();
    }
    root.up().up();

    switch (format) {
      case "pretty": {
        const xmlStr = root.end({ prettyPrint: true });
        return `${xmlStr}\n`;
      }
      case "minimal": {
        const xmlStr = root.end({ prettyPrint: false });
        return `${xmlStr}\n`;
      }
      case "base64": {
        const xmlStr = root.end({ prettyPrint: false });
        const b64Str = Buffer.from(xmlStr).toString("base64");
        return `${b64Str}\n`;
      }
      default: {
        const impossible: never = format;
        throw new Error(`Impossible format: ${JSON.stringify(impossible)}`);
      }
    }
  }
}

export function validateFormat(format: string): Format {
  if (format === "pretty" || format === "minimal" || format === "base64") {
    return format;
  }
  throw new Error(`Invalid format: ${JSON.stringify(format)}`);
}
