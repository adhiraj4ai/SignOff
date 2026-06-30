export type CategoryColor =
  | "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "gray";

/** The macOS-style palette keys, in the order ensureCategory assigns them. */
export const CATEGORY_COLORS: CategoryColor[] = [
  "red", "orange", "yellow", "green", "blue", "purple", "gray",
];

export interface Category {
  id: string; // stable slug from name at creation; survives rename/recolor
  name: string;
  color: CategoryColor;
}

/** Lowercase, trim, collapse non-alphanumeric runs to "-", strip edge dashes. */
export function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "category";
}

/** Trim, lowercase, drop empties, dedupe while preserving first-seen order. */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().toLowerCase();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
