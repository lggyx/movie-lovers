import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, getSecret } from "@/lib/db";
import { findUserById, setRating, RatingError } from "@/lib/store";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

// Rate a watched movie from 1 to 5 stars. Re-rating replaces the old value.
export async function PUT(request) {
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
  try {
    return NextResponse.json(setRating(db, user.id, movieId, body?.rating));
  } catch (e) {
    if (e instanceof RatingError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "could not save the rating" }, { status: 500 });
  }
}
