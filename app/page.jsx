"use client";

import { useState } from "react";
import MovieCard from "@/components/MovieCard";

export default function HomePage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [searchedFor, setSearchedFor] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSearch(e) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results);
      setSearchedFor(query);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-8">
      <h1 className="text-3xl font-bold">Find your next favourite movie</h1>
      <p className="mt-1 text-slate-400">
        Search TMDB, build a watchlist, rate what you watched and get similar picks.
      </p>

      <form onSubmit={onSearch} className="mt-6 flex gap-2" role="search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search movie titles…"
          aria-label="Search movies"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-amber-500 px-5 py-2 font-semibold text-slate-950 hover:bg-amber-400"
        >
          Search
        </button>
      </form>

      {loading && <p className="mt-6 text-slate-400">Searching…</p>}
      {error && <p className="mt-6 text-rose-400">{error}</p>}

      {results && !loading && (
        <>
          <h2 className="mt-8 text-xl font-semibold">
            {results.length} result{results.length === 1 ? "" : "s"} for “{searchedFor}”
          </h2>
          {results.length === 0 ? (
            <p className="mt-2 text-slate-400">Nothing found. Try another title.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-4">
              {results.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
