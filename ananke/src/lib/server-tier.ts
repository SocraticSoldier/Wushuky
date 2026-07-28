/**
 * Server-side tier read, for Server Components.
 *
 * The gate (lib/gate.ts) reads the cookie off a NextRequest inside route
 * handlers. Server Components don't have a request object — they use `cookies()`
 * from next/headers — so this is the equivalent read for rendering decisions.
 * It re-verifies the signature exactly like the gate does; a Server Component
 * that renders the paid UI is still backed by the server's own check.
 */
import { cookies } from "next/headers";
import { readSessionValue, SESSION_COOKIE, type SessionData } from "./session";
import type { Tier } from "./tiers";

export async function getServerSession(): Promise<SessionData | null> {
  const store = await cookies();
  return readSessionValue(store.get(SESSION_COOKIE)?.value);
}

export async function getServerTier(): Promise<Tier> {
  return (await getServerSession())?.tier ?? "free";
}
