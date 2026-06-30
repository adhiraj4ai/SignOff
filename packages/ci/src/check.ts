import path from "node:path";
import { getApprovalStatus, type DocumentType, type ApprovalStatus } from "@signoff/vault-core";

export interface CheckResult {
  ok: boolean;
  status: ApprovalStatus | "not_found";
  message: string;
}

/** Run the gate against the cloned vault at <projectRoot>/.signoff.
 *  ok iff the feature's <type> is approved (getApprovalStatus already enforces
 *  content-hash freshness). Never throws — any failure is a closed gate. */
export async function runCheck(opts: {
  projectRoot: string;
  feature: string;
  type: DocumentType;
}): Promise<CheckResult> {
  const vaultPath = path.join(opts.projectRoot, ".signoff");
  try {
    const res = await getApprovalStatus(vaultPath, opts.feature, opts.type);
    const ok = res.status === "approved";
    const message = ok
      ? `SignOff: ${opts.feature}/${opts.type} is approved${res.approved_by ? ` by ${res.approved_by}` : ""}.`
      : res.status === "not_found"
        ? `SignOff: no ${opts.type} submitted for "${opts.feature}" — get it approved in SignOff before merging.`
        : `SignOff: ${opts.feature}/${opts.type} is "${res.status}", not approved — get sign-off in SignOff before merging.`;
    return { ok, status: res.status, message };
  } catch (err) {
    return {
      ok: false,
      status: "not_found",
      message: `SignOff: could not verify approval (${err instanceof Error ? err.message : String(err)}) — failing closed.`,
    };
  }
}
