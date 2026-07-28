/**
 * The session cookie.
 *
 * A licence key is long and secret; we do not want it re-sent on every request.
 * So on unlock we mint a short signed token — `payload.signature`, signed with
 * SESSION_SECRET (a *different* secret from the key secret) — and store it in an
 * httpOnly cookie. Every gated request re-verifies this signature; the cookie
 * is data the browser holds, never something the server trusts on its face.
 */
import { b64urlDecode, b64urlEncode, hmac, timingSafeEqualStr } from "./crypto";
import { isTier, type Tier } from "./tiers";

export const SESSION_COOKIE = "ananke_session";

/** How long a session lasts before the visitor must unlock again. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionData {
  /** The key id this session was unlocked with (for support / revocation UX). */
  kid: string;
  tier: Tier;
  /** Session expiry, unix seconds. Independent of the key's own expiry. */
  exp: number;
}

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

/** Sign session data into the cookie value. */
export function createSessionValue(data: SessionData, secret: string = sessionSecret()): string {
  const body = b64urlEncode(JSON.stringify(data));
  return `${body}.${hmac(secret, body)}`;
}

/**
 * Verify and decode a cookie value. Returns null for anything that is not a
 * currently-valid, correctly-signed session — a forged cookie is simply "free".
 */
export function readSessionValue(
  value: string | undefined | null,
  opts?: { now?: number; secret?: string },
): SessionData | null {
  if (!value) return null;
  const secret = opts?.secret ?? sessionSecret();
  const now = opts?.now ?? Math.floor(Date.now() / 1000);

  const dot = value.indexOf(".");
  if (dot <= 0 || dot !== value.lastIndexOf(".")) return null;

  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!timingSafeEqualStr(sig, hmac(secret, body))) return null;

  let data: unknown;
  try {
    data = JSON.parse(b64urlDecode(body).toString("utf8"));
  } catch {
    return null;
  }

  if (!isValidSession(data)) return null;
  if (now >= data.exp) return null;
  return data;
}

function isValidSession(value: unknown): value is SessionData {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.kid === "string" &&
    isTier(s.tier) &&
    typeof s.exp === "number"
  );
}

/**
 * Cookie flags. `Secure` is dropped in development so the cookie works over
 * http://localhost; in production it is always on. httpOnly (no JS access),
 * SameSite=Strict (never sent cross-site) and path=/ are non-negotiable.
 */
export function sessionCookieOptions(maxAge: number = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}
