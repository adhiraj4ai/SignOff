import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { VaultManager, readManifest } from "../src/index.js";

let root: string, vaultPath: string;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "signoff-pub-"));
  process.env.SIGNOFF_HOME = path.join(root, "home");
  vaultPath = path.join(root, ".signoff");
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.writeFile(path.join(root, "docs", "a.md"), "# spec\n");
  await VaultManager.create(vaultPath, "Test", undefined);
});
afterEach(async () => { await fs.rm(root, { recursive: true, force: true }); });

describe("publish suggestions", () => {
  it("sets category on an uncategorized feature and creates the category", async () => {
    const v = await VaultManager.open(vaultPath);
    await v.publish("docs/a.md", "user-auth", "spec", "a@b.c", "Author", { category: "Backend" });
    const m = await readManifest(vaultPath);
    expect(m.categories.map((c) => c.name)).toContain("Backend");
    expect(m.features["user-auth"].category).toBe("backend");
  });

  it("does not clobber a category already set", async () => {
    const v = await VaultManager.open(vaultPath);
    await v.publish("docs/a.md", "user-auth", "spec", "a@b.c", "Author", { category: "Backend" });
    await v.publish("docs/a.md", "user-auth", "spec", "a@b.c", "Author", { category: "Frontend" });
    const m = await readManifest(vaultPath);
    expect(m.features["user-auth"].category).toBe("backend");
  });

  it("unions tags across publishes", async () => {
    const v = await VaultManager.open(vaultPath);
    await v.publish("docs/a.md", "user-auth", "spec", "a@b.c", "Author", { tags: ["security"] });
    await v.publish("docs/a.md", "user-auth", "spec", "a@b.c", "Author", { tags: ["v2", "security"] });
    const m = await readManifest(vaultPath);
    expect(m.features["user-auth"].tags).toEqual(["security", "v2"]);
  });
});
