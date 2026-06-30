import { build } from "esbuild";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
rmSync(new URL("./dist", import.meta.url), { recursive: true, force: true });

await build({
  absWorkingDir: here,
  entryPoints: {
    gate: "../superpowers-hook/src/cli.ts",
    mcp: "../mcp-server/src/index.ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  // Some bundled deps (simple-git, the MCP SDK) use CommonJS `require`; provide
  // one in the ESM output so they resolve at runtime.
  banner: {
    js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);",
  },
});

console.log("built dist/gate.mjs and dist/mcp.mjs");
