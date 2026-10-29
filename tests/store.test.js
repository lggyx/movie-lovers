// Watchlist and rating logic — the two flows the acceptance criteria call out.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createDatabase,
  createUser,
  findUserByEmail,
  addToWatchlist,
  isInWatchlist,
  removeFromWatchlist,
  listWatchlist,
  setWatched,
  setRating,
  getRating,
  RatingError,
} from "../lib/store";
import { hashPassword } from "../lib/auth";

let dataDir;
let db;
let user;

const MOVIE = {
  id: 603,
  title: "The Matrix",
  poster_path: "/matrix.jpg",
  year: "1999",
  vote_average: 8.2,
};

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "movie-lovers-test-"));
  db = createDatabase(dataDir);
  const { salt, hash } = hashPassword("secret-password");
  user = createUser(db, "fan@example.com", hash, salt);
});

afterEach(() => {
  db.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

describe("users", () => {
  it("creates a user and finds them by email", () => {
    const found = findUserByEmail(db, "fan@example.com");
    expect(found.id).toBe(user.id);
  });

  it("rejects a duplicate email", () => {
    const { salt, hash } = hashPassword("another-password");
    expect(() => createUser(db, "fan@example.com", hash, salt)).toThrow();
  });
});

describe("watchlist add / remove", () => {
  it("adds a movie once and reports it as already present", () => {
    expect(addToWatchlist(db, user.id, MOVIE).added).toBe(true);
    expect(isInWatchlist(db, user.id, MOVIE.id)).toBe(true);
    expect(addToWatchlist(db, user.id, MOVIE).added).toBe(false);
    expect(listWatchlist(db, user.id)).toHaveLength(1);
  });

  it("removes a movie and its rating", () => {
    addToWatchlist(db, user.id, MOVIE);
    setWatched(db, user.id, MOVIE.id, true);
    setRating(db, user.id, MOVIE.id, 5);
    removeFromWatchlist(db, user.id, MOVIE.id);
    expect(listWatchlist(db, user.id)).toHaveLength(0);
    expect(getRating(db, user.id, MOVIE.id)).toBeNull();
  });

  it("keeps other users' watchlists separate", () => {
    const { salt, hash } = hashPassword("other-password");
    const other = createUser(db, "other@example.com", hash, salt);
    addToWatchlist(db, user.id, MOVIE);
    expect(listWatchlist(db, other.id)).toHaveLength(0);
  });
});

describe("marking watched", () => {
  it("toggles the watched flag", () => {
    addToWatchlist(db, user.id, MOVIE);
    expect(setWatched(db, user.id, MOVIE.id, true).updated).toBe(true);
    expect(listWatchlist(db, user.id)[0].watched).toBe(1);
    setWatched(db, user.id, MOVIE.id, false);
    expect(listWatchlist(db, user.id)[0].watched).toBe(0);
  });

  it("does nothing for a movie that is not on the watchlist", () => {
    expect(setWatched(db, user.id, 999, true).updated).toBe(false);
  });
});

describe("ratings", () => {
  beforeEach(() => {
    addToWatchlist(db, user.id, MOVIE);
    setWatched(db, user.id, MOVIE.id, true);
  });

  it("stores and updates a 1-5 star rating", () => {
    setRating(db, user.id, MOVIE.id, 3);
    expect(getRating(db, user.id, MOVIE.id)).toBe(3);
    setRating(db, user.id, MOVIE.id, 5);
    expect(getRating(db, user.id, MOVIE.id)).toBe(5);
    expect(listWatchlist(db, user.id)[0].rating).toBe(5);
  });

  it("rejects ratings outside 1-5", () => {
    for (const bad of [0, 6, -1, 3.5, "4", null]) {
      expect(() => setRating(db, user.id, MOVIE.id, bad)).toThrow(RatingError);
    }
  });

  it("refuses to rate a movie that has not been watched", () => {
    setWatched(db, user.id, MOVIE.id, false);
    expect(() => setRating(db, user.id, MOVIE.id, 4)).toThrow(/watched/);
  });

  it("refuses to rate a movie that is not on the watchlist", () => {
    expect(() => setRating(db, user.id, 999, 4)).toThrow(/watchlist/);
  });

  it("clears the rating when the movie is marked unwatched", () => {
    setRating(db, user.id, MOVIE.id, 4);
    setWatched(db, user.id, MOVIE.id, false);
    expect(getRating(db, user.id, MOVIE.id)).toBeNull();
  });
});
