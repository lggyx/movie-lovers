// Session tokens and password hashing.
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, signSession, verifySession } from "../lib/auth";

describe("passwords", () => {
  it("hashes and verifies a password", () => {
    const { salt, hash } = hashPassword("hunter22");
    expect(hash).not.toContain("hunter22");
    expect(verifyPassword("hunter22", salt, hash)).toBe(true);
  });

  it("rejects the wrong password", () => {
    const { salt, hash } = hashPassword("hunter22");
    expect(verifyPassword("hunter23", salt, hash)).toBe(false);
  });

  it("uses a fresh salt every time", () => {
    const a = hashPassword("same-password");
    const b = hashPassword("same-password");
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe("sessions", () => {
  const secret = "test-secret";

  it("round-trips a valid token", () => {
    const token = signSession(42, secret);
    expect(verifySession(token, secret)).toBe(42);
  });

  it("rejects a tampered token", () => {
    const token = signSession(42, secret);
    const parts = token.split(".");
    parts[0] = "999";
    expect(verifySession(parts.join("."), secret)).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    expect(verifySession(signSession(42, secret), "other-secret")).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = signSession(42, secret, -1000);
    expect(verifySession(token, secret)).toBeNull();
  });

  it("rejects garbage tokens", () => {
    expect(verifySession("", secret)).toBeNull();
    expect(verifySession("not-a-token", secret)).toBeNull();
  });
});
