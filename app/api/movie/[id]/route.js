import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, getSecret } from "@/lib/db";
import { findUserById, getWatchlistMovieIds } from "@/lib/store";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { movieDetails, movieRecommendations } from "@/lib/tmdb";
import { filterSimilar } from "@/lib/similar";

// Returns the movie details plus up to 10 similar picks. For signed-in users,
// similar picks never include movies already on their watchlist.
export async function GET(_request, { params }) {
  const { id } = await params;
  const movieId = Number(id);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return NextResponse.json({ error: "invalid movie id" }, { status: 400 });
  }
  try {
    const movie = await movieDetails(movieId);
    let recommendations = await movieRecommendations(movieId);
    const store = await cookies();
    const userId = verifySession(store.get(SESSION_COOKIE)?.value, getSecret());
    let excludeIds = [];
    if (userId && findUserById(db, userId)) {
      excludeIds = getWatchlistMovieIds(db, userId);
      excludeIds.push(movieId);
    } else {
      excludeIds = [movieId];
    }
    const similar = filterSimilar(recommendations, excludeIds, 10);
    return NextResponse.json({ movie, similar });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
