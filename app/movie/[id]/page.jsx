"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MovieCard from "@/components/MovieCard";
import Stars from "@/components/Stars";

export default function MoviePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [entry, setEntry] = useState(null); // this movie's watchlist entry, if any
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2500);
  };

  const load = useCallback(async () => {
    try {
      const [movieRes, meRes] = await Promise.all([
        fetch(`/api/movie/${id}`),
        fetch("/api/auth/me"),
      ]);
      const movieData = await movieRes.json();
      if (!movieRes.ok) throw new Error(movieData.error || "Could not load the movie");
      const meData = await meRes.json();
      setData(movieData);
      setMe(meData.user);
      if (meData.user) {
        const wlRes = await fetch("/api/watchlist");
        if (wlRes.ok) {
          const wlData = await wlRes.json();
          setEntry(wlData.items.find((it) => it.movie_id === Number(id)) ?? null);
        }
      } else {
        setEntry(null);
      }
    } catch (err) {
      setLoadError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function authedFetch(url, options) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function addToWatchlist() {
    setBusyWrap(async () => {
      const m = data.movie;
      await authedFetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movie_id: m.id,
          title: m.title,
          poster_path: m.poster_path,
          release_year: m.year,
          vote_average: m.vote_average,
        }),
      });
      flash("Added to your watchlist");
      await load();
    });
  }

  async function removeFromWatchlist() {
    setBusyWrap(async () => {
      await authedFetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movie_id: Number(id) }),
      });
      flash("Removed from your watchlist");
      await load();
    });
  }

  async function toggleWatched() {
    setBusyWrap(async () => {
      const next = !(entry?.watched === 1);
      await authedFetch("/api/watchlist/watched", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movie_id: Number(id), watched: next }),
      });
      flash(next ? "Marked as watched" : "Marked as not watched");
      await load();
    });
  }

  async function rate(stars) {
    setBusyWrap(async () => {
      await authedFetch("/api/ratings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movie_id: Number(id), rating: stars }),
      });
      flash(`Rated ${stars} star${stars > 1 ? "s" : ""}`);
      await load();
    });
  }

  function setBusyWrap(fn) {
    if (busy) return;
    setBusy(true);
    setError("");
    fn()
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }

  if (loadError) return <p className="py-10 text-rose-400">{loadError}</p>;
  if (!data) return <p className="py-10 text-slate-400">Loading…</p>;

  const { movie, similar } = data;
  const poster = movie.poster_path
    ? movie.poster_path.startsWith("http")
      ? movie.poster_path
      : `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : null;
  const isOnList = !!entry;
  const isWatched = entry?.watched === 1;

  return (
    <section className="py-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt={`Poster of ${movie.title}`}
            className="w-52 shrink-0 rounded-lg ring-1 ring-slate-800"
          />
        ) : (
          <div className="flex h-78 w-52 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-5xl ring-1 ring-slate-800">
            🎬
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{movie.title}</h1>
          <p className="mt-1 text-slate-400">
            {movie.year ?? "—"}
            {movie.runtime ? ` · ${movie.runtime} min` : ""}
            {movie.vote_average != null && ` · TMDB ⭐ ${Number(movie.vote_average).toFixed(1)}/10`}
          </p>
          {movie.genres?.length > 0 && (
            <p className="mt-1 text-sm text-slate-400">{movie.genres.join(" · ")}</p>
          )}
          <p className="mt-4 max-w-prose text-slate-300">{movie.overview || "No overview available."}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {!me && (
              <p className="text-sm text-slate-400">
                <a href="/login" className="text-amber-400 hover:underline">
                  Sign in
                </a>{" "}
                to build your watchlist and rate movies.
              </p>
            )}
            {me && !isOnList && (
              <button
                onClick={addToWatchlist}
                disabled={busy}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
              >
                + Add to watchlist
              </button>
            )}
            {me && isOnList && (
              <>
                <button
                  onClick={removeFromWatchlist}
                  disabled={busy}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700 disabled:opacity-50"
                >
                  Remove from watchlist
                </button>
                <button
                  onClick={toggleWatched}
                  disabled={busy}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700 disabled:opacity-50"
                >
                  {isWatched ? "Mark as not watched" : "Mark as watched"}
                </button>
              </>
            )}
          </div>

          {me && isOnList && isWatched && (
            <div className="mt-4">
              <p className="text-sm text-slate-400">
                Your rating{entry?.rating ? ` (currently ${entry.rating}/5)` : ""}
              </p>
              <Stars value={entry?.rating ?? 0} onChange={rate} />
            </div>
          )}
          {me && isOnList && !isWatched && (
            <p className="mt-4 text-sm text-slate-500">Mark it as watched to rate it.</p>
          )}

          {notice && <p className="mt-3 text-sm text-emerald-400">{notice}</p>}
          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        </div>
      </div>

      <h2 className="mt-12 text-xl font-semibold">
        Similar picks{me ? " (excluding your watchlist)" : ""}
      </h2>
      {similar.length === 0 ? (
        <p className="mt-2 text-slate-400">No similar movies found.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-4">
          {similar.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </section>
  );
}
