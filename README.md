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
  app/
    (marketing)/        Public landing page  ->  /
    (dashboard)/        Authenticated area with its own layout
      dashboard/        ->  /dashboard
    admin/              Admin area with its own layout  ->  /admin
    layout.tsx          Root layout (fonts, theme, no-flash script)
    globals.css         Tailwind + theme tokens
  components/
    ui/
      Button.tsx        Variant/size button primitive
      ThemeToggle.tsx   Light/dark theme switch
  lib/
    supabase.ts         Browser Supabase client factory
    utils.ts            `cn()` class-merge helper
public/
  assets/               Static assets
```

> **Note on route groups:** `(marketing)` and `(dashboard)` are route groups —
> the parentheses do not appear in the URL. The dashboard page lives at
> `(dashboard)/dashboard/page.tsx` so it resolves to `/dashboard` rather than
> colliding with the marketing page at `/`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
