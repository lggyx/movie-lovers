// Similar picks must never include movies already on the user's watchlist.
import { describe, expect, it } from "vitest";
import { filterSimilar } from "../lib/similar";

const recs = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, title: `Movie ${i + 1}` }));

describe("filterSimilar", () => {
  it("returns at most 10 recommendations", () => {
    expect(filterSimilar(recs, [])).toHaveLength(10);
  });

  it("excludes movies already on the watchlist", () => {
    const out = filterSimilar(recs, [1, 2, 3]);
    expect(out.map((m) => m.id)).not.toContain(1);
    expect(out.map((m) => m.id)).not.toContain(2);
    expect(out.map((m) => m.id)).not.toContain(3);
    expect(out).toHaveLength(10);
    expect(out[0].id).toBe(4);
  });

  it("still respects the 10-movie cap after exclusions", () => {
    const excluded = Array.from({ length: 8 }, (_, i) => i + 1); // exclude 1..8
    const out = filterSimilar(recs, excluded);
    expect(out.map((m) => m.id)).toEqual([9, 10, 11, 12, 13, 14, 15]);
  });

  it("honours a custom limit", () => {
    expect(filterSimilar(recs, [], 3)).toHaveLength(3);
  });

  it("handles an empty recommendation list", () => {
    expect(filterSimilar([], [])).toEqual([]);
  });
});
