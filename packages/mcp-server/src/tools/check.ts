import {
  getApprovalStatus,
  pullLatest,
  hasRemote,
  type DocumentType,
  type CheckApprovalResult,
} from "@signoff/vault-core";

export async function handleCheck(
  vaultPath: string,
  args: unknown
): Promise<CheckApprovalResult> {
  if (typeof args !== "object" || args === null) {
    throw new Error("args must be a plain object");
  }

  const { feature_name, document_type } = args as Record<string, unknown>;

  if (typeof feature_name !== "string" || feature_name.length === 0) {
    throw new Error("feature_name must be a non-empty string");
  }
  if (document_type !== "spec" && document_type !== "plan") {
    throw new Error(
      `document_type must be "spec" or "plan", got: ${String(document_type)}`
    );
  }

  // Pull the latest first so the developer sees the reviewer's newest decision,
  // not a stale local clone. Best-effort: offline falls back to local. When a
  // remote IS configured but the pull fails, we cannot confirm the local clone
  // is fresh — so report stale: true honestly rather than implying confirmed
  // freshness. With no remote configured, the local clone IS authoritative.
  let stale = false;
  try {
    await pullLatest(vaultPath);
  } catch {
    // Pull failed. If a remote exists, freshness is unconfirmed → stale.
    // If no remote, there is nothing to be stale against.
    try {
      stale = await hasRemote(vaultPath);
    } catch {
      // Could not even determine remotes — be conservative and report stale.
      stale = true;
    }
  }

  const status = await getApprovalStatus(vaultPath, feature_name, document_type as DocumentType);
  return { ...status, stale };
}
