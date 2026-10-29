// Offline end-to-end check of the movie API's data path: TMDB client in mock
// mode (fixtures) + real SQLite watchlist + the same filter the route applies.
// This is exactly the composition inside app/api/movie/[id]/route.js, run
// without network and without a TMDB key.
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.TMDB_MOCK = "1";

import { movieDetails, movieRecommendations, searchMovies } from "../lib/tmdb";
import { filterSimilar } from "../lib/similar";
import { createDatabase, createUser, addToWatchlist, getWatchlistMovieIds } from "../lib/store";
import { hashPassword } from "../lib/auth";

describe("tmdb client in mock mode (offline read-through)", () => {
  it("searches the bundled catalogue", async () => {
    const results = await searchMovies("matrix");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ id: 603, title: "The Matrix", year: "1999" });
  });

  it("loads movie details with genres and year", async () => {
    const m = await movieDetails(603);
    expect(m.title).toBe("The Matrix");
    expect(m.year).toBe("1999");
    expect(m.genres).toContain("Science Fiction");
  });

  it("fetches recommendations (fixture read-through)", async () => {
    const recs = await movieRecommendations(603);
    expect(recs.length).toBeGreaterThanOrEqual(13); // 13 fixtures: enough that the 10-cap and the exclusions are independently observable
    expect(recs.map((m) => m.id)).toContain(27205);
    expect(recs.map((m) => m.id)).toContain(475557);
  });
});

describe("offline end-to-end: similar picks exclude the watchlist", () => {
  it("applies the same composition as the movie API route", async () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "movie-lovers-e2e-"));
    const db = createDatabase(dataDir);
    try {
      const { salt, hash } = hashPassword("password123");
      const user = createUser(db, "e2e@example.com", hash, salt);
      addToWatchlist(db, user.id, { id: 603, title: "The Matrix" });
      addToWatchlist(db, user.id, { id: 27205, title: "Inception" });

      // same sequence as app/api/movie/[id]/route.js
      const movie = await movieDetails(603);
      const recommendations = await movieRecommendations(movie.id);
      const excludeIds = [...getWatchlistMovieIds(db, user.id), movie.id];
      const similar = filterSimilar(recommendations, excludeIds, 10);

      // 13 recommendations minus 2 excluded ids leaves 11; the filter caps at
      // 10, so BOTH facts are observable: the two exclusions (27205 gone even
      // though capacity existed for it) and the cap (the 11th title dropped).
      const ids = similar.map((m) => m.id);
      expect(similar).toHaveLength(10);
      expect(ids).not.toContain(603); // the movie itself
      expect(ids).not.toContain(27205); // on the watchlist — excluded despite free capacity
      expect(ids).not.toContain(475557); // 11th candidate — dropped only by the 10-cap
      expect(ids).toEqual([157336, 155, 1124, 680, 496243, 129, 11, 769, 1422, 87291]);
    } finally {
      db.close();
      fs.rmSync(dataDir, { recursive: true, force: true });
    }
  });
});
