import { describe, it, expect } from "vitest";
import { resolveFeature, featureFromBranch } from "../src/resolve-feature.js";

describe("featureFromBranch", () => {
  it("strips a kind prefix and lowercases the tail", () => {
    expect(featureFromBranch("feat/User-Auth")).toBe("user-auth");
    expect(featureFromBranch("fix/payments")).toBe("payments");
  });
  it("takes the last path segment", () => {
    expect(featureFromBranch("feature/team/user-auth")).toBe("user-auth");
  });
  it("returns null for generic / empty branch names", () => {
    expect(featureFromBranch("main")).toBeNull();
    expect(featureFromBranch("master")).toBeNull();
    expect(featureFromBranch("HEAD")).toBeNull();
    expect(featureFromBranch("")).toBeNull();
  });
});

describe("resolveFeature", () => {
  it("prefers an explicit feature", () => {
    expect(resolveFeature({ feature: "User-Auth", branch: "feat/other" })).toBe("user-auth");
  });
  it("uses the Signoff-Feature trailer over the branch", () => {
    expect(resolveFeature({ prBody: "Implements login.\n\nSignoff-Feature: user-auth\n", branch: "feat/other" })).toBe("user-auth");
  });
  it("is case-insensitive on the trailer key", () => {
    expect(resolveFeature({ prBody: "signoff-feature: Payments" })).toBe("payments");
  });
  it("falls back to the branch when no trailer", () => {
    expect(resolveFeature({ prBody: "no trailer here", branch: "feat/audit-log" })).toBe("audit-log");
  });
  it("returns null when nothing resolves", () => {
    expect(resolveFeature({ prBody: "", branch: "main" })).toBeNull();
    expect(resolveFeature({})).toBeNull();
  });
  it("rejects an invalid trailer slug (path traversal) without falling back", () => {
    expect(resolveFeature({ prBody: "Signoff-Feature: ../etc", branch: "feat/safe" })).toBeNull();
  });
});
