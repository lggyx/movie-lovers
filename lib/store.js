// SQLite store layer. Pure functions take a `db` handle so tests can build
// isolated databases; the app singleton lives in lib/db.js.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  release_year TEXT,
  vote_average REAL,
  watched INTEGER NOT NULL DEFAULT 0,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS ratings (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, movie_id),
  FOREIGN KEY (user_id, movie_id) REFERENCES watchlist(user_id, movie_id) ON DELETE CASCADE
);
`;

export function createDatabase(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "movie-lovers.db"));
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  return db;
}

export class RatingError extends Error {}
export class DuplicateUserError extends Error {}

export function createUser(db, email, passHash, salt) {
  const stmt = db.prepare(
    "INSERT INTO users (email, pass_hash, salt) VALUES (?, ?, ?)"
  );
  const info = stmt.run(email, passHash, salt);
  return { id: Number(info.lastInsertRowid), email };
}

export function findUserByEmail(db, email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

export function findUserById(db, id) {
  return db.prepare("SELECT id, email FROM users WHERE id = ?").get(id);
}

export function listWatchlist(db, userId) {
  return db
    .prepare(
      `SELECT w.movie_id, w.title, w.poster_path, w.release_year, w.vote_average,
              w.watched, w.added_at, r.rating
         FROM watchlist w
         LEFT JOIN ratings r ON r.user_id = w.user_id AND r.movie_id = w.movie_id
        WHERE w.user_id = ?
        ORDER BY w.added_at DESC, w.id DESC`
    )
    .all(userId);
}

export function isInWatchlist(db, userId, movieId) {
  return (
    db
      .prepare("SELECT 1 FROM watchlist WHERE user_id = ? AND movie_id = ?")
      .get(userId, movieId) !== undefined
  );
}

export function addToWatchlist(db, userId, movie) {
  const info = db
    .prepare(
      `INSERT OR IGNORE INTO watchlist (user_id, movie_id, title, poster_path, release_year, vote_average)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      userId,
      movie.id,
      movie.title,
      movie.poster_path ?? null,
      movie.year ?? null,
      movie.vote_average ?? null
    );
  return { added: info.changes > 0 };
}

export function removeFromWatchlist(db, userId, movieId) {
  const info = db
    .prepare("DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?")
    .run(userId, movieId);
  return { removed: info.changes > 0 };
}

export function setWatched(db, userId, movieId, watched) {
  const info = db
    .prepare("UPDATE watchlist SET watched = ? WHERE user_id = ? AND movie_id = ?")
    .run(watched ? 1 : 0, userId, movieId);
  if (info.changes === 0) return { updated: false };
  if (!watched) {
    // A rating only makes sense for a watched movie.
    db.prepare("DELETE FROM ratings WHERE user_id = ? AND movie_id = ?").run(userId, movieId);
  }
  return { updated: true };
}

export function getWatchlistMovieIds(db, userId) {
  return db
    .prepare("SELECT movie_id FROM watchlist WHERE user_id = ?")
    .all(userId)
    .map((r) => r.movie_id);
}

export function validateRating(rating) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new RatingError("rating must be an integer between 1 and 5");
  }
}

export function setRating(db, userId, movieId, rating) {
  validateRating(rating);
  const entry = db
    .prepare("SELECT watched FROM watchlist WHERE user_id = ? AND movie_id = ?")
    .get(userId, movieId);
  if (!entry) throw new RatingError("movie is not on the watchlist");
  if (!entry.watched) throw new RatingError("only watched movies can be rated");
  db.prepare(
    `INSERT INTO ratings (user_id, movie_id, rating) VALUES (?, ?, ?)
     ON CONFLICT (user_id, movie_id) DO UPDATE SET rating = excluded.rating, updated_at = datetime('now')`
  ).run(userId, movieId, rating);
  return { rating };
}

export function getRating(db, userId, movieId) {
  const row = db
    .prepare("SELECT rating FROM ratings WHERE user_id = ? AND movie_id = ?")
    .get(userId, movieId);
  return row ? row.rating : null;
}
