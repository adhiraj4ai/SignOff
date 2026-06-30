import { describe, it, expect } from "vitest";
import { slugify, normalizeTags, CATEGORY_COLORS } from "../src/categories.js";

describe("slugify", () => {
  it("lowercases, trims, and dashes non-alphanumerics", () => {
    expect(slugify("  Back End / API  ")).toBe("back-end-api");
  });
  it("strips leading and trailing dashes", () => {
    expect(slugify("!!UI!!")).toBe("ui");
  });
  it("returns 'category' for an all-symbol name so the id is never empty", () => {
    expect(slugify("///")).toBe("category");
  });
});

describe("normalizeTags", () => {
  it("trims, lowercases, drops empties, dedupes, preserves first-seen order", () => {
    expect(normalizeTags([" Security ", "v2", "security", "", "  ", "V2"])).toEqual([
      "security",
      "v2",
    ]);
  });
});

describe("CATEGORY_COLORS", () => {
  it("is the 7 macOS keys in round-robin order", () => {
    expect(CATEGORY_COLORS).toEqual([
      "red", "orange", "yellow", "green", "blue", "purple", "gray",
    ]);
  });
});
