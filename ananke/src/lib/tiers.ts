/**
 * The tier list, and which route needs which tier.
 *
 * ── This is the file you edit ──────────────────────────────────────────────
 * Add a tier, or gate a new route, here. Everything else reads from this.
 */

export type Tier = "free" | "paid";

export const TIERS: readonly Tier[] = ["free", "paid"] as const;

/** Higher rank = more access. Used for "at least this tier" checks. */
const RANK: Record<Tier, number> = { free: 0, paid: 1 };

export function isTier(value: unknown): value is Tier {
  return value === "free" || value === "paid";
}

/** True when a holder of `have` may access something that needs `need`. */
export function tierSatisfies(have: Tier, need: Tier): boolean {
  return RANK[have] >= RANK[need];
}

/**
 * The minimum tier each protected API route requires. Routes not listed here
 * are open (health, session, unlock). The gate (lib/gate.ts) is still called
 * explicitly at the top of each protected route — this map documents intent
 * and can drive tests, but the server-side call is what actually enforces it.
 */
export const ROUTE_TIERS: Record<string, Tier> = {
  "/api/journal": "paid",
};
