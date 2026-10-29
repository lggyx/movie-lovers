# 🎬 Movie Lovers

A small, self-contained web app for film fans: search movies through The Movie
Database (TMDB), build a personal watchlist, mark movies as watched, rate them
from 1–5 stars, and get up to 10 similar picks for any movie — never including
movies that are already on your watchlist.

Built from scratch as a self-contained feature. No existing codebase is required:
clone (or unzip), follow [SETUP.md](SETUP.md), and it runs locally with one command.

## Features

| Feature | Where |
|---|---|
| Movie search via TMDB (poster, title, year, TMDB rating) | Home page, `GET /api/search?q=` |
| Email + password accounts (scrypt-hashed, signed session cookie) | `/login`, `app/api/auth/*` |
| Watchlist: add / remove movies | Any movie card / detail page, `app/api/watchlist/route.js` |
| Mark movies as watched (un-watching clears the rating) | Watchlist + detail page, `app/api/watchlist/watched/route.js` |
| 1–5 star ratings for watched movies, changeable any time | Watchlist + detail page, `app/api/ratings/route.js` |
| Similar picks: up to 10 TMDB recommendations, excluding watchlist movies | Movie detail page, `lib/similar.js` |

## Stack

- **Next.js 15 (App Router)** — React UI + API routes in one process
- **SQLite via `node:sqlite`** — built into Node.js, no native module install needed
- **Tailwind CSS v4** — styling
- **Vitest** — automated tests (25 tests, one command: `npm test`)
- Server-side only TMDB calls: your API key never reaches the browser

## Project structure

```
app/                    # Next.js App Router: pages + API routes
  page.jsx              # Search page
  movie/[id]/page.jsx   # Movie detail + similar picks
  watchlist/page.jsx    # Watchlist (to watch / watched)
  login/page.jsx        # Sign in / create account
  api/                  # search, movie/[id], auth, watchlist, ratings routes
components/             # NavBar, MovieCard, Stars
lib/
  store.js              # SQLite schema + all watchlist/rating logic (pure, testable)
  auth.js               # scrypt password hashing + HMAC session tokens
  similar.js            # similar-picks filtering (excludes watchlist movies)
  tmdb.js               # TMDB client (real mode + documented mock mode)
  db.js                 # app singletons (database, session secret)
tests/                  # Vitest: store, similar, auth (fixtures in tests/fixtures)
docs/screenshots/       # Screenshots used by USER_GUIDE.md
```

## Requirements → implementation map

- *Search shows poster, title, year and TMDB rating; key from an environment
  variable* → `lib/tmdb.js` reads `TMDB_API_KEY` server-side; the UI never sees it.
- *Signed-in users add/remove movies and mark them watched* → `app/api/watchlist/*`
  requires a valid session; duplicate adds are idempotent.
- *Users rate watched movies 1–5 stars and can change the rating* → `setRating`
  validates an integer 1–5 and refuses movies that are not watched; re-rating
  overwrites the old value.
- *Similar picks exclude watchlist movies* → `filterSimilar(recommendations,
  watchlistMovieIds, 10)` runs server-side on every detail-page load.
- *Automated tests cover watchlist and rating logic* → `tests/store.test.js`
  (12 tests) plus `tests/auth.test.js` and `tests/similar.test.js`.

## Documentation

- [SETUP.md](SETUP.md) — install, environment variables, run, test
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) — plain-language guide for film fans, with screenshots

## Out of scope (by design)

Public deployment, payments, mobile apps, and social features beyond each user's
own watchlist and ratings.
