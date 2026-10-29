"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NavBar() {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          🎬 Movie Lovers
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-slate-300 hover:text-white">
            Search
          </Link>
          <Link href="/watchlist" className="text-slate-300 hover:text-white">
            My watchlist
          </Link>
          {loaded &&
            (user ? (
              <span className="flex items-center gap-2">
                <span className="hidden text-slate-400 sm:inline">{user.email}</span>
                <button
                  onClick={signOut}
                  className="rounded bg-slate-800 px-2 py-1 text-slate-200 hover:bg-slate-700"
                >
                  Sign out
                </button>
              </span>
            ) : (
              <Link
                href="/login"
                className="rounded bg-amber-500 px-3 py-1 font-semibold text-slate-950 hover:bg-amber-400"
              >
                Sign in
              </Link>
            ))}
        </div>
      </nav>
    </header>
  );
}
