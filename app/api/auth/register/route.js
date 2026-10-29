import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createUser, findUserByEmail, DuplicateUserError } from "@/lib/store";
import { hashPassword, signSession, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { getSecret } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "please enter a valid email address" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "password must be at least 6 characters" }, { status: 400 });
  }
  if (findUserByEmail(db, email)) {
    return NextResponse.json({ error: "an account with this email already exists" }, { status: 409 });
  }
  let user;
  try {
    const { salt, hash } = hashPassword(password);
    user = createUser(db, email, hash, salt);
  } catch {
    return NextResponse.json({ error: "could not create the account" }, { status: 500 });
  }
  const res = NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, signSession(user.id, getSecret()), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
