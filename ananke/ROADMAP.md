# ANANKE — what's done, what's left

Status as of commit `9a9e051` on `claude/ananke-initialization-700so0`.

---

## Done and verified

| Area | State | Evidence |
|---|---|---|
| Brand site (`/`) | Hero, five pillars, origin, CTA | `next build` clean, static |
| Design system | Cinematic dark + gold, 3 fonts, grain/thread motifs | `src/app/globals.css` |
| Paywall core | HMAC keys, signed cookie, `requireTier` gate | 49 unit tests |
| Journal product | Daily prompt, streak, free demo vs paid real | end-to-end verified |
| Adversarial hardening | Forged/expired/revoked/tampered all rejected | 26/26 harness |
| Size caps | 64 KB body, 8 000-char entry, 4 KB key | 26/26 harness |

Local gate: **49 unit tests · `tsc --strict` · ESLint · `next build`** — all clean.

---

## P0 — blocks any real use

### 1. Persistence (in-memory → Supabase)
**The single biggest gap.** Entries live in a `Map` in the server process: they
vanish on restart and don't exist across instances. On serverless (Vercel) this
means a journal that silently forgets — the product's core promise broken.

- Touch: `src/lib/journal-store.ts` only. Every caller already goes through
  `getEntries` / `addEntry` / `computeStreak`, so the seam is one file wide.
- Schema: `entries(id, owner, day, prompt, body, created_at)` + an index on
  `(owner, day)`; RLS so a row is readable only by its owner.
- Keep the pure functions (`computeStreak`, `promptForDay`, `dayString`) exactly
  as they are — they're unit-tested and have no I/O.
- Effort: ~half a day including migration + tests.

### 2. CI does not cover ANANKE
`.github/workflows/ci.yml` runs only at the repo root, against the kickboxing
app. **ANANKE's 49 tests never run on push or PR** — a regression would land
silently.

- Add a job (or matrix leg) with `working-directory: ananke` running
  `npm ci && npm run lint && npm run typecheck && npm test && npm run build`.
- Effort: ~20 minutes.

---

## P1 — needed before taking money or going public

### 3. Self-serve billing (Stripe)
Keys are minted by hand — correct for "just me" and one-at-a-time client
onboarding, wrong for public signup.

- Replace `scripts/mint-key.mjs` with a webhook on
  `checkout.session.completed` that mints a key (or writes a tier row).
- The gate, tiers, cookie and paywall UI stay exactly as they are.
- Effort: ~a day with webhook signature verification and a test mode.

### 4. Rate limit `/api/unlock`
Not a forgery risk (256-bit HMAC, timing-safe compare — the 300-forged-unlock
run was uniformly `401`), but an unauthenticated endpoint doing an HMAC per
request is a cheap CPU-burn target.

- Per-IP token bucket, ~10/min, before the signature check.
- Effort: ~1 hour.

### 5. Identity is the licence key
The store is keyed by the key's `kid`. Two keys sharing a `kid` share a journal;
handing the same key to two people merges their entries. Documented in the
README as a minting discipline, but it wants a real fix.

- Introduce accounts (Supabase Auth), make `kid` → `user_id` at unlock, key the
  store on `user_id`.
- Best done **with** P0 so the schema lands right the first time.
- Effort: ~a day, folded into P0.

---

## P2 — polish before showing anyone

| # | Item | Where | Effort |
|---|---|---|---|
| 6 | No favicon / icon / OG image — link previews are blank | `src/app/icon.tsx`, `opengraph-image.tsx` | 1h |
| 7 | No `not-found.tsx` / `error.tsx` — visitors get unstyled Next defaults that break the brand | `src/app/` | 1h |
| 8 | Demo "glimpse" renders for paid users too (sample entries sit above the real journal) | `src/app/journal/page.tsx:42` — wrap in `{tier !== "paid" && …}` | 5 min |
| 9 | Mobile/responsive and a11y unverified — built with responsive classes but never opened in a real viewport | all pages | 2h |

---

## P3 — the brand's actual reason to exist

### 10. There is nowhere to publish content
The strategy doc is a **content** plan — five pillars, ten remix post concepts,
"post daily, track saves and shares". The app currently states the pillars on
the landing page but has no posts, no feed, no archive. Right now ANANKE is a
paywalled journal with a beautiful brochure in front of it, not a content brand.

Worth deciding: does content live here (MDX routes, a `/library` archive, each
post tagged by pillar), or entirely on social with this site as the conversion
destination? That answer changes what gets built next more than anything else
on this list.

---

## One open decision

ANANKE was built in the **`ananke/` subdirectory** so the existing Wu Shu Ky
Kickboxing app was left untouched. If "brand new build completely" meant this
repo should *become* ANANKE, promoting it to the root is a mechanical move
(`git mv`, drop the old `src/`+`supabase/`, merge the CI config) — but it is
destructive to the kickboxing app's working tree, so it needs an explicit call.
