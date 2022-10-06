import {
  binary,
  command,
  subcommands,
  run,
  string,
  positional,
  option,
  Type,
} from "cmd-ts";

import { paperDownload } from "./sources/paper";
import { modrinthDownload } from "./sources/modrinth";
import { spigetDownload } from "./sources/spiget";
import { Format, validateFormat } from "./types/download";

const formatType: Type<string, Format> = {
  /* eslint @typescript-eslint/require-await: "off" */
  from: async (str) => validateFormat(str),
  displayName: "pretty|minimal|base64",
  description: "Output format",
};

const formatParser = option({
  type: formatType,
  long: "format",
  short: "f",
  defaultValue: () => "pretty" as Format,
  defaultValueIsSerializable: true,
});

const paperCmd = command({
  name: "paper",
  args: {
    format: formatParser,
    minecraftVersion: positional({
      type: string,
      displayName: "MINECRAFT_VERSION",
      description: "Minecraft version",
    }),
  },
  handler: async ({ format, minecraftVersion }) => {
    const dl = await paperDownload(minecraftVersion);
    process.stdout.write(dl.metalink(format));
  },
});

const pluginsCmd = command({
  name: "plugins",
  args: {
    format: formatParser,
    minecraftVersion: positional({
      type: string,
      displayName: "MINECRAFT_VERSION",
      description: "Minecraft version",
    }),
    pluginIDs: positional({
      type: string,
      displayName: "[modrinth:ID ...] [spiget:ID ...]",
      description: "Plugin IDs",
    }),
  },
  handler: async ({ format, minecraftVersion, pluginIDs }) => {
    const downloads = pluginIDs.split(/[ ,]+/).map((pluginID) => {
      const [provider, id] = pluginID.split(":", 2);
      if (provider == null || id == null)
        throw new Error(`Invalid plugin ID: ${pluginID}`);
      switch (provider) {
        case "modrinth":
          return modrinthDownload(minecraftVersion, id);
        case "spiget": {
          const idNum = Number(id);
          if (id !== idNum.toString())
            throw new Error(`Invalid Spiget ID: ${id}`);
          return spigetDownload(minecraftVersion, idNum);
        }
        default:
          throw new Error(`Invalid plugin ID: ${pluginID}`);
      }
    });
    for (const dl of await Promise.all(downloads)) {
      process.stdout.write(dl.metalink(format));
    }
  },
});

const cmds = subcommands({
  name: "generate-metalink",
  cmds: {
    paper: paperCmd,
    plugins: pluginsCmd,
  },
  description: "Metalink generator",
});

run(binary(cmds), process.argv).catch((err) => {
  process.stderr.write(`${String(err)}\n`);
  process.exit(1);
});
