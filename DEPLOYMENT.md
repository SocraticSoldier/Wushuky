# Going live

Roughly 20 minutes end to end. Steps 1–3 must happen in order; the domain can
wait until the rest is confirmed working.

---

## 1. Apply the database schema

If you have the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Otherwise use the **SQL Editor** in the Supabase dashboard and run these files
**in order**, one at a time, checking each succeeds before the next:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_class_booking.sql`
3. `supabase/migrations/0003_prevent_role_escalation.sql`
4. `supabase/migrations/0004_allow_admin_bootstrap.sql`
5. `supabase/seed.sql` *(optional — sample plans and classes)*

Order matters: 0002 depends on tables from 0001, and 0004 corrects 0003.

**Verify** — this should return five rows, all with `rowsecurity = t`:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

---

## 2. Configure Auth

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: your production URL (e.g. `https://wushuky.com`)
- **Redirect URLs**: add both
  - `https://<your-domain>/auth/confirm`
  - `https://<your-vercel-preview>.vercel.app/auth/confirm`

Without these, every emailed confirmation and password-reset link is rejected.

> If you want to skip email confirmation for launch, turn off
> *Confirm email* under **Authentication → Providers → Email**. Signups then
> get a session immediately.

---

## 3. Deploy

The app builds without any secrets, so a first deploy will succeed even before
env vars are set — it just runs in demo mode until they are.

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected). No build overrides needed.
3. Add environment variables — **Production, Preview and Development**:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |

   The payment keys in `.env.example` are placeholders — leave them unset until
   payments are actually wired up.

4. Deploy, then open the URL. You should see the marketing page, and
   `/dashboard` should bounce you to `/login`.

> Only ever put the **anon** key in `NEXT_PUBLIC_*`. The `service_role` key
> bypasses every RLS policy — it must never reach the browser, and nothing in
> this app needs it.

---

## 4. Make yourself an admin

Sign up through the deployed site first, then in the SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Confirm it took:

```sql
select u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id;
```

Then reload `/admin` — it should render instead of redirecting.

Members cannot do this to themselves; the SQL Editor is allowed because it
connects with no end-user JWT. See migrations 0003/0004.

---

## 5. Point the domain

Vercel → Project → **Settings → Domains** → add your domain, then create the
DNS records it shows you at your registrar. Once it resolves, go back to
**step 2** and update the Site URL and Redirect URLs to the real domain.

---

## Smoke test

- [ ] `/` renders
- [ ] Sign up → confirmation email arrives (or you're signed straight in)
- [ ] The email link lands you signed in, not on an error
- [ ] `/dashboard` shows your email in the header
- [ ] `/classes` lists the seeded classes; **Book** works and decrements spots
- [ ] `/bookings` shows that booking; cancelling returns the spot
- [ ] `/profile` saves a name and belt
- [ ] `/admin` 403s → after step 4, renders and can schedule a class
- [ ] Signed out, `/dashboard` redirects to `/login`

## If something breaks

| Symptom | Cause |
| --- | --- |
| Every page shows the amber "Demo mode" banner | Env vars missing or not redeployed after adding them |
| Email links error out | `/auth/confirm` not in Redirect URLs (step 2) |
| `/admin` keeps redirecting | Step 4 not applied, or applied to the wrong user id |
| Classes list is empty | `seed.sql` not run — or just add classes via `/admin` |
| Booking always says "full" | Class capacity is genuinely reached; check the `bookings` table |
