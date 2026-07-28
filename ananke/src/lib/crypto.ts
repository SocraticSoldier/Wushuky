/**
 * One HMAC primitive, used everywhere a signature is minted or checked.
 *
 * Keeping this to a single file means there is exactly one place that decides
 * "is this signature valid", and it is timing-safe. Both the licence-key scheme
 * (lib/keys.ts) and the session cookie (lib/session.ts) sign through here.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** URL-safe base64 with no padding — safe inside cookies, headers and keys. */
export function b64urlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

export function b64urlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

/** HMAC-SHA256 of `message` under `secret`, returned as base64url. */
export function hmac(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("base64url");
}

/**
 * Constant-time string compare. Returns early only on a length mismatch, which
 * is not a secret for fixed-length HMAC digests. Never use `===` to compare a
 * signature: that leaks, byte by byte, how much of a forgery was correct.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
