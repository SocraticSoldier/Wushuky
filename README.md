# Wushu Kai

A martial arts training and membership platform built with Next.js, TypeScript,
Tailwind CSS, and Supabase.

## Tech stack

- **Next.js (App Router)** with TypeScript
- **Tailwind CSS v4** for styling, with class-based light/dark theming
- **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) for auth and data
- **lucide-react** for icons
- **clsx** + **tailwind-merge** for class composition

## Getting started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) API key |
| `NEXT_PUBLIC_APPLE_PAY_KEY` | Apple Pay integration key |
| `NEXT_PUBLIC_GOOGLE_PAY_KEY` | Google Pay integration key |
| `NEXT_PUBLIC_REVOLUT_PAY_KEY` | Revolut Pay integration key |

`.env.local` is git-ignored; only `.env.example` is committed.

## Project structure

```
src/
  proxy.ts              Proxy (Next.js 16's renamed Middleware): refreshes
                        the Supabase session and gates protected routes
  app/
    (marketing)/        Public landing page  ->  /
    (dashboard)/        Authenticated area with its own layout
      dashboard/        ->  /dashboard
    admin/              Admin-only area with its own layout  ->  /admin
    login/              ->  /login
    signup/             ->  /signup
    auth/
      actions.ts        Server Actions: login, signup, signOut
    layout.tsx          Root layout (fonts, theme, no-flash script)
    globals.css         Tailwind + theme tokens
  components/
    auth/
      AuthForm.tsx      Shared login/signup form (useActionState)
    ui/
      Button.tsx        Variant/size button primitive
      ThemeToggle.tsx   Light/dark theme switch
  lib/
    auth.ts             getUser / requireUser / requireAdmin helpers
    utils.ts            `cn()` class-merge helper
    supabase/
      client.ts         Browser Supabase client
      server.ts         Server Component / Action client (async cookies)
      proxy.ts          updateSession() used by the root proxy
public/
  assets/               Static assets
```

> **Note on route groups:** `(marketing)` and `(dashboard)` are route groups —
> the parentheses do not appear in the URL. The dashboard page lives at
> `(dashboard)/dashboard/page.tsx` so it resolves to `/dashboard` rather than
> colliding with the marketing page at `/`.

## Authentication

Auth is handled by Supabase using the `@supabase/ssr` cookie-based flow:

- **`src/proxy.ts`** — in **Next.js 16 middleware is renamed to _Proxy_**
  (`proxy.ts`, `export function proxy`). It refreshes the auth session on every
  request and does fast-path redirects for `/dashboard` and `/admin`.
- **Authoritative checks live in the layouts.** `requireUser()` (dashboard) and
  `requireAdmin()` (admin) re-verify with `supabase.auth.getUser()` on the
  server — the proxy redirect is only an optimisation, per the Next.js
  data-security guidance.
- **`/login` and `/signup`** post to Server Actions in `src/app/auth/actions.ts`.
- **Admin role** is read from `user.app_metadata.role === "admin"`. Adjust
  `requireAdmin()` to match your chosen roles model (custom claim, DB table,
  etc.).

Until you set real Supabase credentials in `.env.local`, the app still boots:
public pages render and protected routes redirect to `/login`.

## Features

- **Marketing page** at `/` with sign-in / sign-up calls to action.
- **Member dashboard** at `/dashboard` — membership status, classes booked this
  month, rank, and upcoming classes.
- **Class booking** at `/classes` — book or cancel a spot. Capacity is enforced
  atomically in the database (`book_class` locks the class row), so two members
  racing for the last spot cannot both win.
- **Admin** at `/admin` — member and membership counts, plus scheduling and
  deleting classes. Admin actions re-verify the caller server-side with
  `requireAdmin()`, backed by admin-only RLS policies.

## Database

The schema lives in `supabase/`:

- `supabase/migrations/0001_init.sql` — tables, Row Level Security policies, an
  `is_admin()` helper, and a trigger that creates a `profiles` row on sign-up.
- `supabase/seed.sql` — sample membership plans and classes.

Tables: `profiles`, `membership_plans`, `memberships`, `classes`, `bookings`.
TypeScript types mirroring the schema are in `src/lib/supabase/types.ts` and are
wired into both Supabase clients for end-to-end type safety. Data access lives in
`src/lib/data/` and degrades to safe empty states when the project isn't
configured, so pages always render.

Apply the schema with the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db reset          # applies migrations + seed to your local stack
# or, against a hosted project:
supabase db push
```

After changing the schema, regenerate the types:

```bash
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with a coverage report |

## Testing & CI

Unit tests run on [Vitest](https://vitest.dev) and live next to the code they
cover (`src/**/*.test.ts`). The suite targets the pure logic where the edge
cases actually live:

- `src/lib/routes.test.ts` — route protection and the **open-redirect guard**
- `src/lib/validation/auth.test.ts` — credential validation
- `src/lib/validation/class.test.ts` — class scheduling input validation
- `src/lib/data/classes.test.ts` — booking capacity / spots-left maths
- `src/lib/format.test.ts` — currency and date formatting
- `src/lib/supabase/env.test.ts` — the demo-mode configuration gate

```bash
npm test
```

`.github/workflows/ci.yml` runs lint → typecheck → test → build on every push to
`main` and on all pull requests. CI sets placeholder Supabase env vars so the
build succeeds without any secrets.
