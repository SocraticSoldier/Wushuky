#!/usr/bin/env node
/**
 * Mint an ANANKE licence key by hand.
 *
 *   ANANKE_KEY_SECRET=<secret> node scripts/mint-key.mjs --tier=paid
 *   ANANKE_KEY_SECRET=<secret> node scripts/mint-key.mjs --tier=paid --days=90
 *   ANANKE_KEY_SECRET=<secret> node scripts/mint-key.mjs --tier=paid --kid=jake-phone
 *
 * Prints the key and its id. To kill a key later, add its id to ANANKE_REVOKED
 * and redeploy — it stops working immediately, even if unexpired.
 *
 * Standalone on purpose (no imports from src/) so it runs with plain node and
 * mirrors exactly how lib/keys.ts signs. This is the seam the README describes:
 * replace this script with a Stripe webhook when you go self-serve.
 */
import { createHmac, randomBytes } from "node:crypto";

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const m = /^--([^=]+)=(.*)$/.exec(arg);
    if (m) out[m[1]] = m[2];
    else if (arg.startsWith("--")) out[arg.slice(2)] = true;
  }
  return out;
}

const secret = process.env.ANANKE_KEY_SECRET;
if (!secret) {
  console.error("ANANKE_KEY_SECRET is not set. Refusing to mint an unsigned key.");
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const tier = args.tier ?? "paid";
if (tier !== "free" && tier !== "paid") {
  console.error(`Unknown tier "${tier}". Use --tier=free or --tier=paid.`);
  process.exit(1);
}

const kid = args.kid ?? `k_${randomBytes(4).toString("hex")}`;
const iat = Math.floor(Date.now() / 1000);
const payload = { v: 1, kid, tier, iat };
if (args.days) {
  const days = Number(args.days);
  if (!Number.isFinite(days) || days <= 0) {
    console.error(`--days must be a positive number, got "${args.days}".`);
    process.exit(1);
  }
  payload.exp = iat + Math.round(days * 86400);
}

const body = b64url(JSON.stringify(payload));
const sig = createHmac("sha256", secret).update(body).digest("base64url");
const key = `${body}.${sig}`;

console.log("");
console.log(`  tier   ${tier}`);
console.log(`  id     ${kid}`);
console.log(`  expiry ${payload.exp ? new Date(payload.exp * 1000).toISOString() : "never"}`);
console.log("");
console.log(key);
console.log("");
