import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  VaultManager,
  writeActiveFeature,
  readApproval,
  writeApproval,
  appendHistory,
} from "@chuckle/vault-core";
import { evaluateGate } from "../src/gate.js";

let tmpDir: string;
let projectRoot: string;
let vaultPath: string;

// Publishes a doc into the vault (creates a pending approval record).
async function publish(feature: string, type: "spec" | "plan"): Promise<void> {
  const src = path.join(tmpDir, `${feature}-${type}.md`);
  await fs.writeFile(src, `# ${feature} ${type}\n`);
  const { name, email } = { name: "Dev", email: "dev@org.com" };
  const vault = await VaultManager.open(vaultPath);
  await vault.publish(src, feature, type, email, name);
}

// Flips an existing approval record to "approved".
async function approve(feature: string, type: "spec" | "plan"): Promise<void> {
  const record = await readApproval(vaultPath, feature, type);
  if (!record) throw new Error("no record to approve");
  const updated = appendHistory(record, {
    action: "approved",
    by: "reviewer@org.com",
    at: new Date().toISOString(),
    message: null,
  });
  await writeApproval(vaultPath, updated);
}

function writeEvent(rel: string): { cwd: string; tool_name: string; tool_input: { file_path: string } } {
  return { cwd: projectRoot, tool_name: "Write", tool_input: { file_path: path.join(projectRoot, rel) } };
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "chuckle-gate-test-"));
  projectRoot = path.join(tmpDir, "project");
  vaultPath = path.join(tmpDir, "vault");
  process.env.CHUCKLE_HOME = path.join(tmpDir, ".chuckle-home");
  await fs.mkdir(projectRoot, { recursive: true });
  await VaultManager.create(vaultPath, "test-project", "test-org");
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
  delete process.env.CHUCKLE_HOME;
});

describe("evaluateGate", () => {
  it("allows writes to docs/superpowers/specs regardless of approval", async () => {
    const decision = await evaluateGate(writeEvent("docs/superpowers/specs/foo-design.md"));
    expect(decision.allow).toBe(true);
  });

  it("allows writes to the .chuckle pointer", async () => {
    const decision = await evaluateGate(writeEvent(".chuckle/active-feature.json"));
    expect(decision.allow).toBe(true);
  });

  it("blocks writes to specs2 (not under the real specs dir)", async () => {
    const decision = await evaluateGate(writeEvent("docs/superpowers/specs2/foo.md"));
    expect(decision.allow).toBe(false);
    expect(decision.reason).toMatch(/no active feature|publish a spec|plan/i);
  });

  it("blocks code writes when no active-feature pointer exists", async () => {
    const decision = await evaluateGate(writeEvent("src/index.ts"));
    expect(decision.allow).toBe(false);
    expect(decision.reason).toMatch(/publish a spec first/i);
  });

  it("blocks plan-doc writes when the spec is not approved", async () => {
    await publish("user-auth", "spec");
    await writeActiveFeature(projectRoot, { feature: "user-auth", vaultPath });
    const decision = await evaluateGate(writeEvent("docs/superpowers/plans/user-auth.md"));
    expect(decision.allow).toBe(false);
    expect(decision.reason).toMatch(/spec/i);
  });

  it("allows plan-doc writes once the spec is approved", async () => {
    await publish("user-auth", "spec");
    await approve("user-auth", "spec");
    await writeActiveFeature(projectRoot, { feature: "user-auth", vaultPath });
    const decision = await evaluateGate(writeEvent("docs/superpowers/plans/user-auth.md"));
    expect(decision.allow).toBe(true);
  });

  it("blocks code writes when the plan is not approved", async () => {
    await publish("user-auth", "plan");
    await writeActiveFeature(projectRoot, { feature: "user-auth", vaultPath });
    const decision = await evaluateGate(writeEvent("src/index.ts"));
    expect(decision.allow).toBe(false);
    expect(decision.reason).toMatch(/plan/i);
  });

  it("allows code writes once the plan is approved", async () => {
    await publish("user-auth", "plan");
    await approve("user-auth", "plan");
    await writeActiveFeature(projectRoot, { feature: "user-auth", vaultPath });
    const decision = await evaluateGate(writeEvent("src/index.ts"));
    expect(decision.allow).toBe(true);
  });

  it("fails closed when the pointer references an unreadable vault", async () => {
    await writeActiveFeature(projectRoot, { feature: "ghost", vaultPath: path.join(tmpDir, "nope") });
    const decision = await evaluateGate(writeEvent("src/index.ts"));
    expect(decision.allow).toBe(false);
  });

  it("allows tool calls with no file path target", async () => {
    const decision = await evaluateGate({ cwd: projectRoot, tool_name: "Write", tool_input: {} });
    expect(decision.allow).toBe(true);
  });

  it("blocks NotebookEdit events via notebook_path when no active feature exists", async () => {
    const decision = await evaluateGate({
      cwd: projectRoot,
      tool_name: "NotebookEdit",
      tool_input: { notebook_path: path.join(projectRoot, "src/analysis.ipynb") },
    });
    expect(decision.allow).toBe(false);
  });

  it("blocks MultiEdit events via file_path when no active feature exists", async () => {
    const decision = await evaluateGate({
      cwd: projectRoot,
      tool_name: "MultiEdit",
      tool_input: { file_path: path.join(projectRoot, "src/utils.ts") },
    });
    expect(decision.allow).toBe(false);
  });
});
