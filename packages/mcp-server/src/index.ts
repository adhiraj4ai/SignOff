#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

function parseVaultArg(argv: string[]): string {
  const idx = argv.indexOf("--vault");
  if (idx === -1 || idx + 1 >= argv.length) {
    process.stderr.write(
      "Usage: signoff-mcp --vault /path/to/vault\n"
    );
    process.exit(1);
  }
  return argv[idx + 1];
}

/**
 * Validate the --vault path at startup: it must exist, be a directory, and look
 * like a vault (have a config.json). Exit with a clear error otherwise so we
 * never start a server pointed at a bogus path.
 */
function validateVaultPath(vaultPath: string): void {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(vaultPath);
  } catch {
    process.stderr.write(`Error: vault path does not exist: ${vaultPath}\n`);
    process.exit(1);
  }
  if (!stat.isDirectory()) {
    process.stderr.write(`Error: vault path is not a directory: ${vaultPath}\n`);
    process.exit(1);
  }
  if (!fs.existsSync(path.join(vaultPath, "config.json"))) {
    process.stderr.write(
      `Error: vault path is not a Signoff vault (no config.json): ${vaultPath}\n`
    );
    process.exit(1);
  }
}

async function main() {
  const vaultPath = parseVaultArg(process.argv.slice(2));
  validateVaultPath(vaultPath);
  const server = createServer(vaultPath);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
