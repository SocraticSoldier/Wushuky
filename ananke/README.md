# ANANKE

> Old soul. New world.

The digital home of the ANANKE brand — a cinematic, classical take on
philosophy, mythology and discipline — plus its first product: a paywalled
**journal + accountability** practice.

Named for Ananke, the Greek primordial goddess of *necessity* — the force even
the gods could not escape. The brand reads fate not as resignation but as the
discipline of doing what must be done.

---

## What's here

Two things live in one Next.js app:

1. **The brand site** — a cinematic landing page (`/`) expressing the five
   content pillars (Philosophy · Mythology & Heroes · Discipline &
   Self-Development · Power & Strategy · Playful/Modern), the origin story, and
   the invitation into the product.
2. **The journal** (`/journal`) — one prompt a day in the voice of the ancients,
   with a streak that keeps you honest. **Free** visitors get a canned demo;
   **paid** members get a real journal that persists, behind a licence-key
   paywall.

## Tech stack

- **Next.js 16** (App Router) with TypeScript — see `AGENTS.md` in the repo
  root: this is a modified Next.js, and the docs bundled under
  `node_modules/next/dist/docs/` are the source of truth.
- **Tailwind CSS v4** — a single dark, gold-lit theme (no light mode; the dark
  *is* the brand).
- **next/font/google** — Cinzel (display), Cormorant Garamond (serif), Inter
  (sans).
- **Vitest** for the paywall's security tests. No database — licence keys are
  self-contained and signed.

## Getting started

```bash
cd ananke
npm install

# Two independent secrets (see below), then:
cp .env.example .env.local        # fill in the secrets
npm run mint-key -- --tier=paid   # (needs ANANKE_KEY_SECRET set) → a key to paste

npm run dev                       # http://localhost:3000
```

## The paywall — one rule

**The gate is on the server. The front end only decides what to _show_.**

The licence check lives in the `/api` routes. Someone can force the UI to render
the paid screen all they like — the moment they call `/api/journal`, the server
sees no valid session and returns `402`. Nothing real happens. Every design
choice below follows from that one rule.

### The pieces

```
src/lib/crypto.ts        one HMAC primitive, timing-safe
src/lib/tiers.ts         the tier list + which route needs which tier  ← edit this
src/lib/keys.ts          mint / verify licence keys (no database)
src/lib/session.ts       signed httpOnly cookie so the key isn't re-sent each call
src/lib/gate.ts          requireTier() — the line every protected route calls
src/lib/server-tier.ts   read the verified tier in a Server Component, for rendering only

src/app/api/unlock/      POST a key → validate → set the session cookie
src/app/api/session/     GET the current tier (for the UI; never trusted) · DELETE to lock
src/app/api/journal/     the paid-only feature (the pattern)
src/app/api/dashboard/   free = canned demo, paid = real data

src/components/Paywall.tsx      wrap a paid feature; shows the key box otherwise
src/components/JournalConsole.tsx  the real journal (paid)
scripts/mint-key.mjs            generate keys you hand out
.env.example                    the two secrets + the revocation list
```

### Two secrets

Copy `.env.example` to `.env.local` and fill both, with **different** values:

```bash
openssl rand -base64 48   # → ANANKE_KEY_SECRET
openssl rand -base64 48   # → SESSION_SECRET
```

They're independent on purpose — leaking one doesn't leak the other. Never
commit them; `.env.local` is git-ignored.

### Gating a route

Every protected route starts with two lines:

```ts
import { requireTier } from "@/lib/gate";

export async function POST(req: NextRequest) {
  const denied = requireTier(req, "paid");
  if (denied) return denied;              // ← the whole gate
  // ...your logic, untouched
}
```

To gate a new route, add it to `ROUTE_TIERS` in `src/lib/tiers.ts` (for
documentation and tests) and add those two lines to the route itself.

### Minting keys

```bash
# never expires
npm run mint-key -- --tier=paid

# expires in 90 days
npm run mint-key -- --tier=paid --days=90

# a memorable id (so you can revoke this exact one later)
npm run mint-key -- --tier=paid --kid=jake-phone
```

Each key prints an **id**. To kill a key, add its id to `ANANKE_REVOKED` in your
env and redeploy — it stops working immediately, even if unexpired.

### How it holds up

| Attack | What happens |
|---|---|
| Edit the tier in devtools / React state | UI may change; `/api/journal` still returns `402`. No access. |
| Forge a `paid` cookie by hand | Signature check fails (`SESSION_SECRET`). Treated as free. |
| Forge a licence key | Signature check fails (`ANANKE_KEY_SECRET`). Rejected as `invalid_key`. |
| Replay an expired key | `exp` check rejects it. |
| Reuse a revoked key | `ANANKE_REVOKED` blocks it at unlock. |
| Steal the session cookie | It's `HttpOnly` + `SameSite=Strict` (+ `Secure` in production). |
| Probe unlock to learn why a key failed | One identical `invalid_key` for every failure mode. No signal. |

These are covered by the test suite: `npm test`.

## The honest limits

- **Journal persistence is in-memory** in this first build — entries live in the
  running server process, keyed by the licence-key id. That is enough to make
  the product real end-to-end while keeping the initialise step dependency-free.
  The store (`src/lib/journal-store.ts`) is a clean seam: swap the `Map` for a
  Supabase table and nothing above it changes.
- **Keys are minted by hand** — perfect for "just me" and onboarding clients one
  at a time. When you want public self-serve signups, replace `mint-key.mjs`
  with a Stripe webhook that mints a key on `checkout.session.completed`.
  Everything else — the gate, the tiers, the cookie, the paywall UI — stays
  exactly as it is.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Run the Vitest suite (paywall + journal) |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run lint` | ESLint |
| `npm run mint-key -- --tier=paid` | Mint a licence key |
