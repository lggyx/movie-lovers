# SETUP

How to install, configure, run and test Movie Lovers on a clean machine.

## 1. Prerequisites

- **Node.js 22.5 or newer** (the app uses the built-in `node:sqlite` module;
  tested on Node 26). Check with:

  ```
  node --version
  ```

- No database server, no other services — everything else is `npm install`.

## 2. Get a TMDB API key (free)

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/).
2. Go to **Settings → API** and request a free **API Key (v3 auth)**.
3. Copy the key string (32 hex characters).

## 3. Configure environment variables

Copy the example file and paste your key:

```
copy .env.example .env      # Windows
cp .env.example .env        # macOS / Linux
```

| Variable | Required | Purpose |
|---|---|---|
| `TMDB_API_KEY` | yes (real usage) | Your free TMDB v3 key. Read server-side only. |
| `AUTH_SECRET` | no | Random string used to sign session cookies. If unset, one is generated automatically and stored in `data/secret.key`. |
| `TMDB_MOCK` | no | Set to `1` to serve bundled demo data instead of calling TMDB (offline demos, screenshots, tests). Posters show placeholder images in this mode. |

> Next.js reads `.env` automatically. If you prefer, export the variables in
> your shell instead — same names.

## 4. Install dependencies

```
npm install
```

## 5. Run the app

```
npm run dev
```

Then open **http://localhost:3210**. That's the whole thing — one command.

The SQLite database is created automatically at `data/movie-lovers.db` on first
use. To start from scratch, stop the server and delete the `data/` folder.

Production-style run (optional):

```
npm run build
npm start
```

## 6. Run the tests

```
npm test
```

One command, no extra setup: 25 automated tests cover the watchlist logic
(add / remove / duplicate-add / per-user isolation / watched flag), the rating
logic (1–5 validation, watched-only rule, updating, clearing on unwatch), the
similar-picks filter (excludes watchlist movies, caps at 10) and password
hashing + session tokens. Tests use their own temporary databases and never
touch `data/` or the network.

## 7. Running without a TMDB key (demo mode)

Set `TMDB_MOCK=1` before starting:

```
set TMDB_MOCK=1 && npm run dev     # Windows
TMDB_MOCK=1 npm run dev            # macOS / Linux
```

The app then serves a bundled catalogue (The Matrix, Inception, Interstellar, …)
with placeholder posters. Every feature works the same way; the data is clearly
demo data. Screenshots in [USER_GUIDE.md](USER_GUIDE.md) were taken in this mode.

## Troubleshooting

- **`TMDB_API_KEY is not set`** — you skipped step 3, or `.env` is not in the
  project root next to `package.json`.
- **Port 3210 already in use** — change the port in `package.json`
  (`"dev": "next dev -p YOUR_PORT"`) and use the same port in the browser.
- **`node:sqlite` not found** — your Node.js is older than 22.5; upgrade Node.
- **Forgot your password** — delete `data/movie-lovers.db` and register again
  (this is a local app; there is no email recovery by design).

## What "clean machine" verification covered

The delivered build was verified by: fresh `npm install` → `npm test` (25/25
pass) → `npm run dev` in demo mode → every screen and flow exercised in a real
browser (see USER_GUIDE screenshots) → API flows re-verified with `curl`
(register → watchlist → watched → rating → similar-picks exclusion → validation
errors). The exact commands in this file are the ones that were run.
