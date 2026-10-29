"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Stars from "@/components/Stars";

function posterSrc(p) {
  if (!p) return null;
  return p.startsWith("http") ? p : `https://image.tmdb.org/t/p/w342${p}`;
}

export default function WatchlistPage() {
  const [me, setMe] = useState(null);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2500);
  };

  const load = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      setMe(meData.user);
      if (meData.user) {
        const res = await fetch("/api/watchlist");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load the watchlist");
        setItems(data.items);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(fn, message) {
    setError("");
    try {
      await fn();
      if (message) flash(message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const remove = (movieId) =>
    act(
      () =>
        fetch("/api/watchlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movie_id: movieId }),
        }),
      "Removed from your watchlist"
    );

  const toggleWatched = (movieId, watched) =>
    act(
      () =>
        fetch("/api/watchlist/watched", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movie_id: movieId, watched }),
        }),
      watched ? "Marked as watched" : "Marked as not watched"
    );

  const rate = (movieId, rating) =>
    act(
      () =>
        fetch("/api/ratings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movie_id: movieId, rating }),
        }),
      `Rated ${rating} star${rating > 1 ? "s" : ""}`
    );

  if (!loaded) return <p className="py-10 text-slate-400">Loading…</p>;

  if (!me) {
    return (
      <section className="py-10">
        <h1 className="text-2xl font-bold">My watchlist</h1>
        <p className="mt-3 text-slate-400">
          <Link href="/login" className="text-amber-400 hover:underline">
            Sign in
          </Link>{" "}
          to build your watchlist.
        </p>
      </section>
    );
  }

  const unwatched = (items ?? []).filter((it) => it.watched !== 1);
  const watched = (items ?? []).filter((it) => it.watched === 1);

  return (
    <section className="py-8">
      <h1 className="text-2xl font-bold">My watchlist</h1>
      <p className="mt-1 text-sm text-slate-400">
        {unwatched.length} to watch · {watched.length} watched
      </p>
      {notice && <p className="mt-2 text-sm text-emerald-400">{notice}</p>}
      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

      {items && items.length === 0 && (
        <p className="mt-6 text-slate-400">
          Your watchlist is empty.{" "}
          <Link href="/" className="text-amber-400 hover:underline">
            Search for movies
          </Link>{" "}
          to add some.
        </p>
      )}

      {[
        ["To watch", unwatched],
        ["Watched", watched],
      ].map(([label, list]) =>
        list.length === 0 ? null : (
          <div key={label} className="mt-8">
            <h2 className="text-lg font-semibold">{label}</h2>
            <ul className="mt-3 space-y-3">
              {list.map((it) => {
                const src = posterSrc(it.poster_path);
                return (
                  <li
                    key={it.movie_id}
                    className="flex items-center gap-4 rounded-lg bg-slate-900 p-3 ring-1 ring-slate-800"
                  >
                    <Link href={`/movie/${it.movie_id}`} className="shrink-0">
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={`Poster of ${it.title}`}
                          className="h-24 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-16 items-center justify-center rounded bg-slate-800 text-xl">
                          🎬
                        </div>
                      )}
                    </Link>
                    <div className="flex-1">
                      <Link href={`/movie/${it.movie_id}`} className="font-semibold hover:text-amber-400">
                        {it.title}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {it.release_year ?? "—"}
                        {it.vote_average != null && ` · TMDB ⭐ ${Number(it.vote_average).toFixed(1)}`}
                      </p>
                      {it.watched === 1 && (
                        <div className="mt-1">
                          <p className="text-xs text-slate-500">Your rating</p>
                          <Stars
                            size="text-lg"
                            value={it.rating ?? 0}
                            onChange={(stars) => rate(it.movie_id, stars)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <button
                        onClick={() => toggleWatched(it.movie_id, it.watched !== 1)}
                        className="rounded bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700"
                      >
                        {it.watched === 1 ? "Mark unwatched" : "Mark watched"}
                      </button>
                      <button
                        onClick={() => remove(it.movie_id)}
                        className="rounded bg-slate-800 px-2 py-1 text-xs text-rose-300 hover:bg-slate-700"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )
      )}
    </section>
  );
}
