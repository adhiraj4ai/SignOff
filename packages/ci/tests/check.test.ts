import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import {
  VaultManager,
  readApproval,
  writeApproval,
  applyReviewerAction,
  hashContent,
} from "@signoff/vault-core";
import { runCheck } from "../src/check.js";

let project: string;
beforeEach(async () => {
  project = await fs.mkdtemp(path.join(os.tmpdir(), "signoff-ci-"));
});
afterEach(async () => {
  await fs.rm(project, { recursive: true, force: true });
});

async function setupApprovedPlan(approved: boolean): Promise<void> {
  const vaultPath = path.join(project, ".signoff");
  await VaultManager.create(vaultPath, "proj");
  await fs.mkdir(path.join(project, "docs"), { recursive: true });
  await fs.writeFile(path.join(project, "docs", "x.md"), "# plan");
  const v = await VaultManager.open(vaultPath);
  await v.submitForReview("x", "plan", "docs/x.md", "a@o.c", "A");
  if (approved) {
    const hash = hashContent(await fs.readFile(path.join(project, "docs", "x.md")));
    let rec = await readApproval(vaultPath, "x", "plan");
    rec = applyReviewerAction(rec!, "a@o.c", "start_review", "2026-06-30T00:00:00Z", hash, null);
    rec = applyReviewerAction(rec, "a@o.c", "approve", "2026-06-30T00:01:00Z", hash, null);
    await writeApproval(vaultPath, rec);
  }
}

describe("runCheck", () => {
  it("ok when the plan is approved (fresh)", async () => {
    await setupApprovedPlan(true);
    const r = await runCheck({ projectRoot: project, feature: "x", type: "plan" });
    expect(r.ok).toBe(true);
    expect(r.status).toBe("approved");
  });
  it("not ok when the plan is pending", async () => {
    await setupApprovedPlan(false);
    const r = await runCheck({ projectRoot: project, feature: "x", type: "plan" });
    expect(r.ok).toBe(false);
  });
  it("not ok / not_found when no plan registered", async () => {
    const vaultPath = path.join(project, ".signoff");
    await VaultManager.create(vaultPath, "proj");
    const r = await runCheck({ projectRoot: project, feature: "ghost", type: "plan" });
    expect(r.ok).toBe(false);
    expect(r.status).toBe("not_found");
  });
  it("fails closed (no throw) when the vault is missing", async () => {
    const r = await runCheck({ projectRoot: project, feature: "x", type: "plan" });
    expect(r.ok).toBe(false);
  });
});
