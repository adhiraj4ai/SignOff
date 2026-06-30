import type { DocumentType } from "./types.js";

export type Tier = "light" | "standard" | "heavy";
export const TIER_KEYS: Tier[] = ["light", "standard", "heavy"];

/** Coerce any stored/suggested value to a valid Tier; absent/unknown ⇒ "standard". */
export function normalizeTier(value: unknown): Tier {
  return value === "light" || value === "heavy" ? value : "standard";
}

/** The artifact whose approval clears code for a tier. */
export function tierGatingArtifact(tier: Tier): DocumentType {
  return tier === "light" ? "spec" : "plan";
}

/** Heavy ignores approval_mode:threshold and requires unanimous approval. */
export function tierForcesUnanimous(tier: Tier): boolean {
  return tier === "heavy";
}
