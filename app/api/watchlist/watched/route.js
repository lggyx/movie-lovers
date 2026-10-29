import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, getSecret } from "@/lib/db";
import { findUserById, setWatched } from "@/lib/store";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

// Mark a watchlist movie as watched (or unwatch it). Unwatching clears any rating.
export async function PATCH(request) {
  const store = await cookies();
  const userId = verifySession(store.get(SESSION_COOKIE)?.value, getSecret());
  const user = userId ? findUserById(db, userId) : null;
  if (!user) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const movieId = Number(body?.movie_id);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return NextResponse.json({ error: "invalid movie_id" }, { status: 400 });
  }
  if (typeof body?.watched !== "boolean") {
    return NextResponse.json({ error: "watched must be true or false" }, { status: 400 });
  }
  return NextResponse.json(setWatched(db, user.id, movieId, body.watched));
}
