/**
 * Licence keys — minted and verified with no database.
 *
 * A key is `payload.signature`, both base64url:
 *
 *     eyJ2IjoxLCJ...      .      Xr9c8...
 *     └─ JSON payload ─┘         └─ HMAC(ANANKE_KEY_SECRET, payload) ─┘
 *
 * The payload carries its own tier and expiry, so verification needs only the
 * secret — nothing to look up. Revocation is the one thing a self-contained key
 * cannot carry, so it lives in the environment (see `isRevoked`) and is checked
 * at unlock.
 */
import { b64urlDecode, b64urlEncode, hmac, timingSafeEqualStr } from "./crypto";
import { isTier, type Tier } from "./tiers";

export interface KeyPayload {
  /** Schema version, so the format can evolve without ambiguity. */
  v: 1;
  /** Key id — a human-memorable handle used only for revocation. */
  kid: string;
  tier: Tier;
  /** Issued-at, unix seconds. */
  iat: number;
  /** Expiry, unix seconds. Omitted = never expires. */
  exp?: number;
}

export type VerifyResult =
  | { ok: true; payload: KeyPayload }
  | { ok: false };

function keySecret(): string {
  const s = process.env.ANANKE_KEY_SECRET;
  if (!s) throw new Error("ANANKE_KEY_SECRET is not set");
  return s;
}

/** Mint a signed key. Pure over its inputs so it is trivially testable. */
export function mintKey(payload: KeyPayload, secret: string = keySecret()): string {
  const body = b64urlEncode(JSON.stringify(payload));
  return `${body}.${hmac(secret, body)}`;
}

/**
 * Verify a key's signature, shape and expiry. Returns a single `{ ok: false }`
 * for every failure mode — a bad signature, a forged payload, an expired key
 * all look identical to the caller, so probing learns nothing.
 */
export function verifyKey(
  key: string,
  opts?: { now?: number; secret?: string },
): VerifyResult {
  const secret = opts?.secret ?? keySecret();
  const now = opts?.now ?? Math.floor(Date.now() / 1000);

  if (typeof key !== "string") return { ok: false };
  const dot = key.indexOf(".");
  if (dot <= 0 || dot !== key.lastIndexOf(".")) return { ok: false };

  const body = key.slice(0, dot);
  const sig = key.slice(dot + 1);

  // Check the signature before trusting a single byte of the payload.
  if (!timingSafeEqualStr(sig, hmac(secret, body))) return { ok: false };

  let payload: unknown;
  try {
    payload = JSON.parse(b64urlDecode(body).toString("utf8"));
  } catch {
    return { ok: false };
  }

  if (!isValidPayload(payload)) return { ok: false };
  if (payload.exp !== undefined && now >= payload.exp) return { ok: false };

  return { ok: true, payload };
}

function isValidPayload(value: unknown): value is KeyPayload {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    p.v === 1 &&
    typeof p.kid === "string" &&
    p.kid.length > 0 &&
    isTier(p.tier) &&
    typeof p.iat === "number" &&
    (p.exp === undefined || typeof p.exp === "number")
  );
}

/**
 * Is this key id on the revocation list? Reads `ANANKE_REVOKED` (comma or
 * whitespace separated) so a key can be killed by env + redeploy, even before
 * it expires. Kept separate from `verifyKey` because revocation is deployment
 * state, not a property of the key itself.
 */
export function isRevoked(kid: string, revokedEnv: string | undefined = process.env.ANANKE_REVOKED): boolean {
  if (!revokedEnv) return false;
  const revoked = revokedEnv
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return revoked.includes(kid);
}
