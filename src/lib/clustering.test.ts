import { describe, expect, it } from "vitest";
import { groupLikelyDuplicates, isLikelyDuplicate } from "./clustering";

const base = {
  id: "a",
  title: "EU adopts AI Act rules for high-risk systems",
  canonicalUrl: "https://example.com/a",
  entities: ["EU", "AI Act"],
  publishedAt: "2026-07-04T10:00:00Z"
};

describe("clustering", () => {
  it("deduplicates exact canonical URLs", () => {
    expect(isLikelyDuplicate(base, { ...base, id: "b" })).toBe(true);
  });

  it("deduplicates close titles with shared entities inside the three-day horizon", () => {
    expect(
      isLikelyDuplicate(base, {
        id: "b",
        title: "EU sets AI Act rules for high risk technology systems",
        canonicalUrl: "https://example.com/b",
        entities: ["EU", "AI Act", "technology"],
        publishedAt: "2026-07-04T13:00:00Z"
      })
    ).toBe(true);
  });

  it("does not group similar words without shared entities", () => {
    expect(
      isLikelyDuplicate(base, {
        id: "c",
        title: "EU debates energy market rules for high risk systems",
        canonicalUrl: "https://example.com/c",
        entities: ["EU", "energy"],
        publishedAt: "2026-07-04T13:00:00Z"
      })
    ).toBe(false);
  });

  it("groups candidates into event clusters", () => {
    const groups = groupLikelyDuplicates([
      base,
      {
        id: "b",
        title: "EU sets AI Act rules for high risk technology systems",
        canonicalUrl: "https://example.com/b",
        entities: ["EU", "AI Act"],
        publishedAt: "2026-07-04T13:00:00Z"
      },
      {
        id: "c",
        title: "Central bank keeps rates unchanged",
        canonicalUrl: "https://example.com/c",
        entities: ["Central Bank"],
        publishedAt: "2026-07-04T13:00:00Z"
      }
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveLength(2);
  });
});

