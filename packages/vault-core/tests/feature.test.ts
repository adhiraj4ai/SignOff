import { describe, it, expect } from "vitest";
import { inferFeatureName } from "../src/feature.js";

describe("inferFeatureName", () => {
  it("extracts feature from dated design filename", () => {
    expect(inferFeatureName("2026-06-27-user-auth-design.md")).toBe("user-auth");
  });

  it("extracts feature from dated plan filename", () => {
    expect(inferFeatureName("2026-06-27-payment-gateway.md")).toBe("payment-gateway");
  });

  it("handles filename without date prefix", () => {
    expect(inferFeatureName("user-auth-design.md")).toBe("user-auth");
  });

  it("handles plain feature name", () => {
    expect(inferFeatureName("user-auth.md")).toBe("user-auth");
  });

  it("handles absolute paths by using only the basename", () => {
    expect(inferFeatureName("/home/dev/project/docs/specs/2026-06-27-user-auth-design.md")).toBe("user-auth");
  });

  it("lowercases the result", () => {
    expect(inferFeatureName("2026-06-27-UserAuth-design.md")).toBe("userauth");
  });
});
