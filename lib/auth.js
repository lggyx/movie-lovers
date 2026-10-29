// Password hashing and session token signing (pure crypto, no I/O).
import crypto from "node:crypto";

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(expectedHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function signSession(userId, secret, ttlMs = SESSION_TTL_MS) {
  const exp = Date.now() + ttlMs;
  const payload = `${userId}.${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySession(token, secret) {
  const parts = String(token ?? "").split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${userId}.${exp}`)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return null;
  const id = Number(userId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const SESSION_COOKIE = "ml_session";
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
