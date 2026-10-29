import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findUserByEmail } from "@/lib/store";
import { verifyPassword, signSession, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { getSecret } from "@/lib/db";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const user = findUserByEmail(db, email);
  if (!user || !verifyPassword(password, user.salt, user.pass_hash)) {
    return NextResponse.json({ error: "wrong email or password" }, { status: 401 });
  }
  const res = NextResponse.json({ user: { id: user.id, email: user.email } });
  res.cookies.set(SESSION_COOKIE, signSession(user.id, getSecret()), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
