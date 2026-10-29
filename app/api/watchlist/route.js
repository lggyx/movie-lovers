import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, getSecret } from "@/lib/db";
import { findUserById, listWatchlist, isInWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/store";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

async function requireUser() {
  const store = await cookies();
  const userId = verifySession(store.get(SESSION_COOKIE)?.value, getSecret());
  if (!userId) return null;
  const user = findUserById(db, userId);
  return user ? { id: user.id, email: user.email } : null;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  return NextResponse.json({ items: listWatchlist(db, user.id) });
}

export async function POST(request) {
  const user = await requireUser();
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
  if (typeof body?.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const result = addToWatchlist(db, user.id, {
    id: movieId,
    title: body.title.trim(),
    poster_path: body.poster_path ?? null,
    year: body.release_year ?? null,
    vote_average: body.vote_average ?? null,
  });
  return NextResponse.json({ ...result, already: isInWatchlist(db, user.id, movieId) }, { status: 201 });
}

export async function DELETE(request) {
  const user = await requireUser();
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
  return NextResponse.json(removeFromWatchlist(db, user.id, movieId));
}
