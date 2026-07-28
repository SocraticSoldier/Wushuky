import { NextResponse, type NextRequest } from "next/server";
import { isRevoked, verifyKey } from "@/lib/keys";
import {
  createSessionValue,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
} from "@/lib/session";

/**
 * Trade a licence key for a session cookie.
 *
 * Every failure — malformed body, bad signature, forged payload, expired,
 * revoked — returns the *same* `invalid_key`. Probing the endpoint tells an
 * attacker nothing about why their key didn't work.
 */
export async function POST(req: NextRequest) {
  const invalid = () =>
    NextResponse.json({ error: "invalid_key" }, { status: 401 });

  let key: unknown;
  try {
    ({ key } = await req.json());
  } catch {
    return invalid();
  }
  if (typeof key !== "string") return invalid();

  const now = Math.floor(Date.now() / 1000);
  const result = verifyKey(key, { now });
  if (!result.ok) return invalid();
  if (isRevoked(result.payload.kid)) return invalid();

  // Session lives at most SESSION_TTL, and never past the key's own expiry.
  const sessionExp = result.payload.exp
    ? Math.min(result.payload.exp, now + SESSION_TTL_SECONDS)
    : now + SESSION_TTL_SECONDS;
  const maxAge = sessionExp - now;

  const res = NextResponse.json({ ok: true, tier: result.payload.tier });
  res.cookies.set(
    SESSION_COOKIE,
    createSessionValue({
      kid: result.payload.kid,
      tier: result.payload.tier,
      exp: sessionExp,
    }),
    sessionCookieOptions(maxAge),
  );
  return res;
}
