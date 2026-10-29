import { NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";

export async function GET(request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ results: [] });
  try {
    return NextResponse.json({ results: await searchMovies(q) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
