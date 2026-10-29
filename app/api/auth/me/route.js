import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, getSecret } from "@/lib/db";
import { findUserById } from "@/lib/store";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  const store = await cookies();
  const userId = verifySession(store.get(SESSION_COOKIE)?.value, getSecret());
  if (!userId) return NextResponse.json({ user: null });
  const user = findUserById(db, userId);
  return NextResponse.json({ user: user ? { id: user.id, email: user.email } : null });
}
