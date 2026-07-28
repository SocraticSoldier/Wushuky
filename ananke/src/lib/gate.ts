/**
 * The line every protected route calls.
 *
 *   export async function POST(req: NextRequest) {
 *     const denied = requireTier(req, "paid");
 *     if (denied) return denied;        // ← the whole gate, right here
 *     // ...your logic, untouched
 *   }
 *
 * The gate is on the server. The front end only decides what to *show* — the
 * moment an unpaid request reaches a gated route, this returns 402 and the real
 * logic below it never runs.
 */
import { NextResponse, type NextRequest } from "next/server";
import { readSessionValue, SESSION_COOKIE, type SessionData } from "./session";
import { tierSatisfies, type Tier } from "./tiers";

/** The verified session on this request, or null. Safe to trust. */
export function getSession(req: NextRequest): SessionData | null {
  return readSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
}

/** The verified tier on this request. Defaults to "free". */
export function getTier(req: NextRequest): Tier {
  return getSession(req)?.tier ?? "free";
}

/**
 * Returns a 402 response if the request's tier does not satisfy `need`, or
 * `null` if it does (so the caller proceeds). Synchronous: it reads the cookie
 * straight off the request and re-checks its signature.
 */
export function requireTier(req: NextRequest, need: Tier): NextResponse | null {
  if (tierSatisfies(getTier(req), need)) return null;
  return NextResponse.json(
    { error: "payment_required", need },
    { status: 402 },
  );
}
