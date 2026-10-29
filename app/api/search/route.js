import { NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";

export async function GET(request) {
  // Cap the query length and pass it to the TMDB client, which only ever uses
  // it as a URLSearchParams value (percent-encoded), never as part of the URL.
  let q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (q.length > 200) q = q.slice(0, 200);
  if (!q) return NextResponse.json({ results: [] });
  try {
    return NextResponse.json({ results: await searchMovies(q) });
  } catch (e) {
    // Error messages never include the upstream URL or the API key.
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
