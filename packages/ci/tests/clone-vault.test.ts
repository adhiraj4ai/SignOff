import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { buildCloneArgs, cloneVaultWithToken } from "../src/clone-vault.js";

const exec = promisify(execFile);

describe("buildCloneArgs", () => {
  it("validates the URL and ends option parsing with --", () => {
    const args = buildCloneArgs("https://github.com/org/vault.git", "dest");
    expect(args).toContain("clone");
    expect(args).toContain("--");
    expect(args[args.length - 2]).toBe("https://github.com/org/vault.git");
    expect(args[args.length - 1]).toBe("dest");
  });
  it("adds a masked Authorization extraHeader when a token is given", () => {
    const args = buildCloneArgs("https://github.com/org/vault.git", "dest", "TKN");
    const i = args.indexOf("-c");
    expect(i).toBe(0);
    const basic = Buffer.from("x-access-token:TKN").toString("base64");
    expect(args[1]).toBe(`http.extraHeader=AUTHORIZATION: basic ${basic}`);
  });
  it("omits the header when no token", () => {
    expect(buildCloneArgs("https://github.com/org/vault.git", "dest")).not.toContain("-c");
  });
  it("throws on an option-injection URL", () => {
    expect(() => buildCloneArgs("--upload-pack=evil", "dest")).toThrow();
  });
});

describe("cloneVaultWithToken (local file:// clone, no token)", () => {
  let dir: string;
  beforeEach(async () => { dir = await fs.mkdtemp(path.join(os.tmpdir(), "signoff-clone-")); });
  afterEach(async () => { await fs.rm(dir, { recursive: true, force: true }); });

  it("clones a local source repo into dest", async () => {
    const src = path.join(dir, "src");
    await fs.mkdir(src, { recursive: true });
    await exec("git", ["init", "-q", src]);
    await exec("git", ["-C", src, "config", "user.email", "t@t.c"]);
    await exec("git", ["-C", src, "config", "user.name", "t"]);
    await fs.writeFile(path.join(src, "config.json"), '{"name":"v"}');
    await exec("git", ["-C", src, "add", "."]);
    await exec("git", ["-C", src, "commit", "-q", "-m", "init"]);

    const dest = path.join(dir, "out");
    await cloneVaultWithToken(src, dest);
    expect((await fs.readFile(path.join(dest, "config.json"), "utf-8")).length).toBeGreaterThan(0);
  });
});
