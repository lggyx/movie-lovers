import Link from "next/link";

function posterSrc(posterPath) {
  if (!posterPath) return null;
  return posterPath.startsWith("http")
    ? posterPath
    : `https://image.tmdb.org/t/p/w342${posterPath}`;
}

export default function MovieCard({ movie, children }) {
  const src = posterSrc(movie.poster_path);
  return (
    <div className="flex w-40 flex-col overflow-hidden rounded-lg bg-slate-900 ring-1 ring-slate-800">
      <Link href={`/movie/${movie.id}`} aria-label={movie.title}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`Poster of ${movie.title}`} className="h-60 w-40 object-cover" />
        ) : (
          <div className="flex h-60 w-40 items-center justify-center bg-slate-800 text-3xl">🎬</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-2 text-xs">
        <Link href={`/movie/${movie.id}`} className="font-semibold leading-tight hover:text-amber-400">
          {movie.title}
        </Link>
        <div className="mt-1 flex items-center justify-between text-slate-400">
          <span>{movie.year ?? "—"}</span>
          {movie.vote_average != null && <span>⭐ {Number(movie.vote_average).toFixed(1)}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}
