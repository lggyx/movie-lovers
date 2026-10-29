// Similar picks: TMDB recommendations minus anything already on the user's watchlist.
export function filterSimilar(recommendations, excludeMovieIds, limit = 10) {
  const excluded = new Set(excludeMovieIds.map(Number));
  const out = [];
  for (const movie of recommendations ?? []) {
    if (excluded.has(Number(movie.id))) continue;
    out.push(movie);
    if (out.length >= limit) break;
  }
  return out;
}
