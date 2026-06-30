import { validateFeatureName } from "@signoff/vault-core";

const KIND_PREFIX = /^(feat|feature|fix|chore|docs|refactor|test|perf|build|ci|style)\//i;
const GENERIC = new Set(["main", "master", "head", "develop", "dev", ""]);
const TRAILER = /^[ \t]*Signoff-Feature:[ \t]*(\S+)[ \t]*$/im;

/** Branch → feature slug: strip one leading kind prefix, take the last path
 *  segment, lowercase. Generic/empty names yield null. */
export function featureFromBranch(branch: string): string | null {
  if (!branch) return null;
  const stripped = branch.trim().replace(KIND_PREFIX, "");
  const seg = stripped.split("/").filter(Boolean).pop() ?? "";
  const slug = seg.toLowerCase();
  if (!slug || GENERIC.has(slug)) return null;
  return slug;
}

/** Resolve the feature a PR implements. Precedence: explicit feature →
 *  `Signoff-Feature:` trailer in prBody → branch inference. The chosen slug
 *  must pass validateFeatureName, else null (no silent fallback). */
export function resolveFeature(opts: { feature?: string; prBody?: string; branch?: string }): string | null {
  const fromTrailer = opts.prBody?.match(TRAILER)?.[1];
  const raw =
    (opts.feature && opts.feature.trim()) ||
    (fromTrailer && fromTrailer.trim()) ||
    (opts.branch ? featureFromBranch(opts.branch) : null);
  if (!raw) return null;
  try {
    return validateFeatureName(raw.toLowerCase());
  } catch {
    return null;
  }
}
