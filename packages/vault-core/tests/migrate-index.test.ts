import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { migrateToIndex } from "../src/migrate.js";
import { readManifest, getFeatureDoc } from "../src/manifest.js";
import { writeApproval } from "../src/approval.js";

let tmp: string, projectRoot: string, vaultPath: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "migrate-index-"));
  projectRoot = path.join(tmp, "project");
  vaultPath = path.join(projectRoot, ".signoff");
  await fs.mkdir(path.join(vaultPath, "specs"), { recursive: true });
  await fs.mkdir(path.join(vaultPath, "approvals"), { recursive: true });
  await fs.writeFile(path.join(vaultPath, "config.json"),
    JSON.stringify({ name: "p", created_at: "t", doc_roots: ["docs"] }) + "\n");
  // simulate a git repo so stageAndCommit works
  const { initVaultRepo } = await import("../src/git.js");
  await initVaultRepo(vaultPath);
});
afterEach(async () => { await fs.rm(tmp, { recursive: true, force: true }); });

describe("migrateToIndex", () => {
  it("rebuilds the manifest from project docs and drops the copy", async () => {
    // old-layout copy in the vault + a matching project doc
    await fs.writeFile(path.join(vaultPath, "specs", "user-auth.md"), "# old copy\n");
    await writeApproval(vaultPath, {
      document: "spec.md", feature: "user-auth", type: "spec", workflow: "spec",
      status: "pending", history: [{ action: "submitted", by: "d@o.c", at: "t", message: null }],
    });
    await fs.mkdir(path.join(projectRoot, "docs", "specs"), { recursive: true });
    await fs.writeFile(path.join(projectRoot, "docs", "specs", "2026-06-27-user-auth-design.md"), "# real\n");

    const res = await migrateToIndex(vaultPath);
    expect(res.migrated).toBe(true);

    const m = await readManifest(vaultPath);
    expect(getFeatureDoc(m, "user-auth", "spec")).toBe("docs/specs/2026-06-27-user-auth-design.md");
    await expect(fs.stat(path.join(vaultPath, "specs", "user-auth.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("keeps the vault copy as a fallback when no project doc matches", async () => {
    await fs.writeFile(path.join(vaultPath, "specs", "orphan.md"), "# orphan\n");
    await writeApproval(vaultPath, {
      document: "spec.md", feature: "orphan", type: "spec", workflow: "spec",
      status: "approved", history: [{ action: "approved", by: "d@o.c", at: "t", message: null }],
    });
    const res = await migrateToIndex(vaultPath);
    expect(res.unresolved).toContain("orphan/spec");
    const m = await readManifest(vaultPath);
    expect(getFeatureDoc(m, "orphan", "spec")).toBe(".signoff/specs/orphan.md");
    expect((await fs.stat(path.join(vaultPath, "specs", "orphan.md"))).isFile()).toBe(true);
  });

  it("is a no-op on an already-migrated vault", async () => {
    await fs.writeFile(path.join(vaultPath, "index.json"), JSON.stringify({ version: 1, features: {} }) + "\n");
    await fs.rm(path.join(vaultPath, "specs"), { recursive: true, force: true });
    const res = await migrateToIndex(vaultPath);
    expect(res.migrated).toBe(false);
  });
});
