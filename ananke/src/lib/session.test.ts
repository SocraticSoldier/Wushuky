import { describe, expect, it } from "vitest";
import {
  createSessionValue,
  readSessionValue,
  sessionCookieOptions,
  type SessionData,
} from "./session";

const SECRET = "test-session-secret";
const OTHER = "attacker-session-secret";
const NOW = 1_700_000_000;

function session(overrides: Partial<SessionData> = {}): SessionData {
  return { kid: "k_test", tier: "paid", exp: NOW + 1000, ...overrides };
}

describe("session cookie", () => {
  it("round-trips a valid session", () => {
    const value = createSessionValue(session(), SECRET);
    const data = readSessionValue(value, { now: NOW, secret: SECRET });
    expect(data?.tier).toBe("paid");
    expect(data?.kid).toBe("k_test");
  });

  it("returns null for a tampered cookie", () => {
    const value = createSessionValue(session({ tier: "free" }), SECRET);
    const [, sig] = value.split(".");
    const forgedBody = Buffer.from(JSON.stringify(session({ tier: "paid" }))).toString(
      "base64url",
    );
    expect(readSessionValue(`${forgedBody}.${sig}`, { now: NOW, secret: SECRET })).toBeNull();
  });

  it("returns null for a cookie signed with a different secret (cross-secret)", () => {
    const value = createSessionValue(session(), OTHER);
    expect(readSessionValue(value, { now: NOW, secret: SECRET })).toBeNull();
  });

  it("returns null for an expired session", () => {
    const value = createSessionValue(session({ exp: NOW + 100 }), SECRET);
    expect(readSessionValue(value, { now: NOW + 200, secret: SECRET })).toBeNull();
  });

  it("returns null for a malformed cookie", () => {
    expect(readSessionValue("garbage", { now: NOW, secret: SECRET })).toBeNull();
    expect(readSessionValue("a.b.c", { now: NOW, secret: SECRET })).toBeNull();
  });

  it("returns null for empty / missing input", () => {
    expect(readSessionValue(undefined, { now: NOW, secret: SECRET })).toBeNull();
    expect(readSessionValue("", { now: NOW, secret: SECRET })).toBeNull();
  });

  it("sets httpOnly + strict flags; secure off outside production", () => {
    const opts = sessionCookieOptions(100);
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("strict");
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBe(100);
    // NODE_ENV is 'test' under vitest, so secure is false (works on localhost).
    expect(opts.secure).toBe(false);
  });
});
