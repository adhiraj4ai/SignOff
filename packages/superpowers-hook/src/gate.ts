import path from "node:path";
import {
  getApprovalStatus,
  readActiveFeature,
  readWorkflows,
  getWorkflowForType,
  type DocumentType,
} from "@chuckle/vault-core";
import type { PreToolUseEvent, GateDecision } from "./types.js";

const SPECS_DIR = "docs/superpowers/specs";
const PLANS_DIR = "docs/superpowers/plans";
const CHUCKLE_DIR = ".chuckle";

function isUnder(rel: string, base: string): boolean {
  return rel === base || rel.startsWith(base + "/");
}

function targetPath(event: PreToolUseEvent): string | null {
  return event.tool_input.file_path ?? event.tool_input.notebook_path ?? null;
}

// Best-effort: only decorates the block message; never affects the allow/block decision.
async function requiredApprovers(
  vaultPath: string,
  type: DocumentType
): Promise<string[]> {
  try {
    const workflows = await readWorkflows(vaultPath);
    return getWorkflowForType(workflows, type).required_approvers;
  } catch {
    return [];
  }
}

export async function evaluateGate(event: PreToolUseEvent): Promise<GateDecision> {
  try {
    const target = targetPath(event);
    if (!target) return { allow: true };

    const abs = path.resolve(event.cwd, target);
    const rel = path.relative(event.cwd, abs);

    // Rule 1: spec authoring is always allowed (the entry point).
    if (isUnder(rel, SPECS_DIR)) return { allow: true };
    // Rule 2: the .chuckle pointer itself is always allowed.
    if (isUnder(rel, CHUCKLE_DIR)) return { allow: true };

    // Rule 3 (plan docs) vs Rule 4 (code): plan-doc writes gate on spec approval;
    // everything else (code, config, etc.) gates on plan approval.
    const type: DocumentType = isUnder(rel, PLANS_DIR) ? "spec" : "plan";

    // Rule 5: no active feature → block.
    const pointer = await readActiveFeature(event.cwd);
    if (!pointer) {
      return {
        allow: false,
        reason:
          "🔒 Chuckle: no active feature. Publish a spec first " +
          "(publish_document) before making changes.",
      };
    }

    const status = await getApprovalStatus(pointer.vaultPath, pointer.feature, type);
    if (status.status === "approved") return { allow: true };

    const approvers = await requiredApprovers(pointer.vaultPath, type);
    const who = approvers.length ? `\nAwaiting approval from: ${approvers.join(", ")}` : "";
    const gated = type === "spec" ? "plan authoring" : "code changes";
    return {
      allow: false,
      reason:
        `🔒 Chuckle: ${gated} are gated.\n` +
        `Feature "${pointer.feature}" — ${type} status: ${status.status}.${who}`,
    };
  } catch (err) {
    // Fail closed: any unexpected error (malformed pointer, unreadable vault) blocks.
    return {
      allow: false,
      reason: `🔒 Chuckle: approval gate could not verify status (${
        err instanceof Error ? err.message : String(err)
      }). Blocking by default.`,
    };
  }
}
