require("esbuild")
  .build({
    entryPoints: ["src/index.ts"],
    outdir: "dist",
    sourcemap: true,
    bundle: true,
    platform: "node",
    target: "node18",
    format: "cjs",
    outExtension: { ".js": ".cjs" },
    banner: {
      js: "#!/usr/bin/env node",
    },
  })
  .then(() => require("fs/promises").chmod("dist/index.cjs", "0755"))
  .catch((err) => {
    process.stderr.write(err);
    process.exit(1);
  });
