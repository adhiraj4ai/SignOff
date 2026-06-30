import { describe, it, expect } from "vitest";
import { normalizeTier, tierGatingArtifact, tierForcesUnanimous, TIER_KEYS } from "../src/tiers.js";
import { setFeatureDoc, setFeatureTier } from "../src/index.js";

describe("normalizeTier", () => {
  it("passes through valid tiers", () => {
    expect(normalizeTier("light")).toBe("light");
    expect(normalizeTier("heavy")).toBe("heavy");
    expect(normalizeTier("standard")).toBe("standard");
  });
  it("coerces unknown/absent to standard", () => {
    expect(normalizeTier(undefined)).toBe("standard");
    expect(normalizeTier("")).toBe("standard");
    expect(normalizeTier("huge")).toBe("standard");
    expect(normalizeTier(3)).toBe("standard");
  });
});

describe("tier gate mapping", () => {
  it("light gates on spec; standard/heavy on plan", () => {
    expect(tierGatingArtifact("light")).toBe("spec");
    expect(tierGatingArtifact("standard")).toBe("plan");
    expect(tierGatingArtifact("heavy")).toBe("plan");
  });
  it("only heavy forces unanimous", () => {
    expect(tierForcesUnanimous("heavy")).toBe(true);
    expect(tierForcesUnanimous("standard")).toBe(false);
    expect(tierForcesUnanimous("light")).toBe(false);
  });
  it("TIER_KEYS lists the three tiers", () => {
    expect(TIER_KEYS).toEqual(["light", "standard", "heavy"]);
  });
});

describe("setFeatureTier", () => {
  const base = { version: 2 as const, categories: [], features: {} };
  it("sets and clears a feature's tier", () => {
    let m = setFeatureDoc(base, "x", "spec", "docs/x.md");
    m = setFeatureTier(m, "x", "light");
    expect(m.features.x.tier).toBe("light");
    m = setFeatureTier(m, "x", null);
    expect(m.features.x.tier).toBeUndefined();
  });
});
