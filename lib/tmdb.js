// TMDB client. Real mode uses the public API with the key from TMDB_API_KEY.
// Mock mode (TMDB_MOCK=1) serves bundled fixtures so the app can be demoed,
// screenshotted and tested without a key — clearly labelled demo data.
import fs from "node:fs";
import path from "node:path";

const API_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w342";
const FIXTURES_DIR = path.join(process.cwd(), "tests", "fixtures", "tmdb");

export function posterUrl(posterPath, width = 342) {
  if (!posterPath) return null;
  if (posterPath.startsWith("http")) return posterPath;
  return `https://image.tmdb.org/t/p/w${width}${posterPath}`;
}

function normalize(m) {
  return {
    id: m.id,
    title: m.title,
    poster_path: m.poster_path ?? null,
    year: (m.release_date ?? "").slice(0, 4) || null,
    vote_average: m.vote_average ?? null,
  };
}

function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, name), "utf8"));
}

function mockResponse(pathname, params) {
  if (pathname === "/search/movie") {
    const all = readFixture("search.json").results;
    const q = String(params?.query ?? "").trim().toLowerCase();
    const results = q ? all.filter((m) => m.title.toLowerCase().includes(q)) : all;
    return { page: 1, results };
  }
  const rec = pathname.match(/^\/movie\/(\d+)\/recommendations$/);
  if (rec) return { page: 1, results: readFixture("recommendations.json").results };
  const det = pathname.match(/^\/movie\/(\d+)$/);
  if (det) {
    const id = Number(det[1]);
    try {
      return readFixture(`movie-${id}.json`);
    } catch {
      const known = readFixture("search.json").results.find((m) => m.id === id);
      return {
        id,
        title: known ? known.title : `Mock Movie ${id}`,
        overview: "Mock overview served in demo mode (TMDB_MOCK=1).",
        release_date: known ? known.release_date : "2020-01-01",
        vote_average: known ? known.vote_average : 7.0,
        poster_path: known ? known.poster_path : null,
        genres: [{ id: 878, name: "Science Fiction" }],
        runtime: 120,
      };
    }
  }
  throw new Error(`mock mode: unsupported path ${pathname}`);
}

async function tmdbGet(pathname, params = {}) {
  if (process.env.TMDB_MOCK === "1") return mockResponse(pathname, params);
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set (see SETUP.md)");
  const url = new URL(API_BASE + pathname);
  url.searchParams.set("api_key", key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`TMDB request failed with status ${res.status}`);
  return res.json();
}

export async function searchMovies(query) {
  const data = await tmdbGet("/search/movie", { query, page: 1 });
  return (data.results ?? []).map(normalize);
}

export async function movieDetails(id) {
  const m = await tmdbGet(`/movie/${Number(id)}`);
  return {
    ...normalize(m),
    overview: m.overview ?? "",
    runtime: m.runtime ?? null,
    genres: (m.genres ?? []).map((g) => g.name),
  };
}

export async function movieRecommendations(id) {
  const data = await tmdbGet(`/movie/${Number(id)}/recommendations`, { page: 1 });
  return (data.results ?? []).map(normalize);
}
