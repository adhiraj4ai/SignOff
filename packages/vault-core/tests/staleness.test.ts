import { describe, it, expect } from "vitest";
import { isStale } from "../src/approval.js";
import type { ApprovalRecord } from "../src/types.js";

function record(history: ApprovalRecord["history"], status: ApprovalRecord["status"]): ApprovalRecord {
  return { document: "docs/a.md", feature: "f", type: "spec", workflow: "spec", status, history };
}

describe("isStale", () => {
  it("is false when the approved hash matches the current hash", () => {
    const r = record(
      [{ action: "approved", by: "a@b.c", at: "t", message: null, content_hash: "abc" }],
      "approved"
    );
    expect(isStale(r, "abc")).toBe(false);
  });

  it("is true when the doc changed after approval", () => {
    const r = record(
      [{ action: "approved", by: "a@b.c", at: "t", message: null, content_hash: "abc" }],
      "approved"
    );
    expect(isStale(r, "xyz")).toBe(true);
  });

  it("is false when not approved", () => {
    const r = record([{ action: "submitted", by: "a@b.c", at: "t", message: null }], "pending");
    expect(isStale(r, "anything")).toBe(false);
  });

  it("treats a legacy approved entry with no hash as not stale", () => {
    const r = record([{ action: "approved", by: "a@b.c", at: "t", message: null }], "approved");
    expect(isStale(r, "anything")).toBe(false);
  });
});
