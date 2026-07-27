-- Wu Shu Ky Kickboxing — complete database setup
--
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- It is the concatenation of supabase/migrations/0001..0006 plus seed data,
-- in dependency order. Re-running it is safe and will not duplicate data.
--
-- Generated from the individual migration files — edit those, not this.


-- ===========================================================================
-- migrations/0001_init.sql
-- ===========================================================================
-- Wu Shu Ky Kickboxing — initial schema
-- Membership platform: profiles, membership plans, memberships, classes, bookings.
-- Row Level Security is enabled on every table with least-privilege policies.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- A public profile row per auth user (created automatically via trigger below).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'member' check (role in ('member', 'admin')),
  belt text,
  created_at timestamptz not null default now()
);

-- Membership plans customers can subscribe to.
create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'GBP',
  billing_interval text not null default 'month'
    check (billing_interval in ('month', 'year')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- A user's current subscription to a plan.
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid references public.membership_plans (id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'canceled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists memberships_user_id_idx on public.memberships (user_id);

-- Scheduled classes.
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  instructor text,
  level text not null default 'all'
    check (level in ('all', 'beginner', 'intermediate', 'advanced')),
  starts_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  capacity integer not null default 20 check (capacity > 0),
  created_at timestamptz not null default now()
);
create index if not exists classes_starts_at_idx on public.classes (starts_at);

-- A user's booking for a class.
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  status text not null default 'booked'
    check (status in ('booked', 'attended', 'canceled')),
  created_at timestamptz not null default now(),
  unique (user_id, class_id)
);
create index if not exists bookings_user_id_idx on public.bookings (user_id);
create index if not exists bookings_class_id_idx on public.bookings (class_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so it can read profiles without tripping RLS recursion when
-- called from within a policy.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.membership_plans enable row level security;
alter table public.memberships enable row level security;
alter table public.classes enable row level security;
alter table public.bookings enable row level security;

-- profiles: users see/update their own; admins see/manage all.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_admin());

-- membership_plans: anyone may read active plans; admins manage.
drop policy if exists "plans_select_all" on public.membership_plans;
create policy "plans_select_all" on public.membership_plans
  for select using (true);
drop policy if exists "plans_admin_write" on public.membership_plans;
create policy "plans_admin_write" on public.membership_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- memberships: users read their own; admins manage all.
drop policy if exists "memberships_select_own_or_admin" on public.memberships;
create policy "memberships_select_own_or_admin" on public.memberships
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "memberships_admin_write" on public.memberships;
create policy "memberships_admin_write" on public.memberships
  for all using (public.is_admin()) with check (public.is_admin());

-- classes: any authenticated user may read; admins manage.
drop policy if exists "classes_select_authenticated" on public.classes;
create policy "classes_select_authenticated" on public.classes
  for select using (auth.uid() is not null);
drop policy if exists "classes_admin_write" on public.classes;
create policy "classes_admin_write" on public.classes
  for all using (public.is_admin()) with check (public.is_admin());

-- bookings: users manage their own; admins read all.
drop policy if exists "bookings_select_own_or_admin" on public.bookings;
create policy "bookings_select_own_or_admin" on public.bookings
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert with check (user_id = auth.uid());
drop policy if exists "bookings_update_own_or_admin" on public.bookings;
create policy "bookings_update_own_or_admin" on public.bookings
  for update using (user_id = auth.uid() or public.is_admin());
drop policy if exists "bookings_delete_own_or_admin" on public.bookings;
create policy "bookings_delete_own_or_admin" on public.bookings
  for delete using (user_id = auth.uid() or public.is_admin());


-- ===========================================================================
-- migrations/0002_class_booking.sql
-- ===========================================================================
-- Wu Shu Ky Kickboxing — class booking
-- Booking must enforce capacity atomically and cannot be done purely from the
-- client: RLS lets a member see only their own bookings, so neither the live
-- booked-count nor a race-free capacity check are possible client-side. These
-- SECURITY DEFINER functions run with elevated rights but only ever act on
-- behalf of the calling user (auth.uid()).

-- Book the calling user into a class. Returns 'booked' on success or 'full'
-- when the class is at capacity. Re-books a previously cancelled booking.
create or replace function public.book_class(p_class_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_taken integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock the class row so concurrent bookings serialise on capacity.
  select capacity into v_capacity
  from public.classes
  where id = p_class_id
  for update;

  if v_capacity is null then
    raise exception 'Class not found';
  end if;

  select count(*) into v_taken
  from public.bookings
  where class_id = p_class_id and status <> 'canceled';

  -- If the user already holds an active booking, treat as success (idempotent).
  if exists (
    select 1 from public.bookings
    where class_id = p_class_id
      and user_id = auth.uid()
      and status <> 'canceled'
  ) then
    return 'booked';
  end if;

  if v_taken >= v_capacity then
    return 'full';
  end if;

  insert into public.bookings (user_id, class_id, status)
  values (auth.uid(), p_class_id, 'booked')
  on conflict (user_id, class_id)
  do update set status = 'booked';

  return 'booked';
end;
$$;

-- Cancel the calling user's booking for a class (idempotent).
create or replace function public.cancel_booking(p_class_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.bookings
  set status = 'canceled'
  where class_id = p_class_id and user_id = auth.uid();

  return 'canceled';
end;
$$;

-- Aggregate booked counts per class, so members can see availability without
-- being able to read individual bookings.
create or replace function public.class_booked_counts()
returns table (class_id uuid, booked_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select class_id, count(*)::bigint
  from public.bookings
  where status <> 'canceled'
  group by class_id;
$$;

-- Lock down execution to signed-in users.
revoke execute on function public.book_class(uuid) from anon;
revoke execute on function public.cancel_booking(uuid) from anon;
revoke execute on function public.class_booked_counts() from anon;
grant execute on function public.book_class(uuid) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.class_booked_counts() to authenticated;


-- ===========================================================================
-- migrations/0003_prevent_role_escalation.sql
-- ===========================================================================
-- Wu Shu Ky Kickboxing — close a privilege-escalation hole on public.profiles
--
-- The 0001 policy was:
--   for update using (id = auth.uid() or public.is_admin())
-- With no WITH CHECK clause, Postgres reuses the USING expression for the new
-- row. That permits a member to update their OWN row and set role = 'admin':
-- the row still satisfies `id = auth.uid()` afterwards. Because the anon key is
-- public, any signed-in member could escalate themselves to admin.
--
-- Column-level grants can't express this cleanly (admins are also
-- `authenticated` and must retain the ability to set roles), so the role column
-- is guarded by a trigger instead.

create or replace function public.enforce_role_change_is_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    -- Determine the caller's role from their own committed row. In a BEFORE
    -- UPDATE trigger a self-update still reads the pre-update value, so a
    -- member promoting themselves is correctly rejected.
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    ) then
      raise exception 'Only admins can change a profile role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_role_change on public.profiles;
create trigger profiles_enforce_role_change
  before update on public.profiles
  for each row execute function public.enforce_role_change_is_admin();

-- Restate the update policy with an explicit WITH CHECK so the intent is
-- documented rather than inherited implicitly.
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());


-- ===========================================================================
-- migrations/0004_allow_admin_bootstrap.sql
-- ===========================================================================
-- Wu Shu Ky Kickboxing — allow bootstrapping the first admin
--
-- Migration 0003 guarded the profiles.role column with a trigger that requires
-- the caller to already be an admin. That is correct for end-user requests, but
-- it also blocks the very first promotion: with no admin in the table, nobody
-- can ever create one — not even from the Supabase SQL editor.
--
-- Fix: only enforce the check when there IS an end-user identity
-- (auth.uid() is not null). Privileged direct access — the SQL editor,
-- service_role, superuser, server-side admin tooling — has no JWT and is
-- allowed through.
--
-- Why this does not reopen the escalation hole:
--   * authenticated member  -> auth.uid() = their id, check runs, blocked.
--   * anon (no JWT)         -> auth.uid() is null, but the RLS policy
--                              `id = auth.uid() or is_admin()` matches no row,
--                              so the UPDATE never reaches this trigger.
--   * service_role/superuser-> bypasses RLS by design and is already trusted.

create or replace function public.enforce_role_change_is_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    -- Privileged direct access (no end-user JWT): allow.
    if auth.uid() is null then
      return new;
    end if;

    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    ) then
      raise exception 'Only admins can change a profile role';
    end if;
  end if;
  return new;
end;
$$;


-- ===========================================================================
-- migrations/0005_unique_plan_name.sql
-- ===========================================================================
-- Wu Shu Ky Kickboxing — make membership plan names unique
--
-- seed.sql inserts the plans with `on conflict do nothing`, which silently does
-- nothing useful: there was no unique constraint for the conflict to target, so
-- re-running the seed appended a fresh copy of every plan each time. Running
-- the setup three times produced nine plans.
--
-- Dedupe any existing rows (keeping the earliest of each name, and repointing
-- memberships at it) before adding the constraint that makes the seed's
-- `on conflict` clause actually work.

-- Repoint memberships at the surviving plan of the same name.
update public.memberships m
set plan_id = keep.id
from public.membership_plans dup
join lateral (
  select p.id
  from public.membership_plans p
  where p.name = dup.name
  order by p.created_at, p.id
  limit 1
) keep on true
where m.plan_id = dup.id
  and dup.id <> keep.id;

-- Remove the duplicates.
delete from public.membership_plans p
where exists (
  select 1 from public.membership_plans keep
  where keep.name = p.name
    and (keep.created_at, keep.id) < (p.created_at, p.id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'membership_plans_name_key'
  ) then
    alter table public.membership_plans
      add constraint membership_plans_name_key unique (name);
  end if;
end
$$;


-- ===========================================================================
-- migrations/0006_lock_down_bookings.sql
-- ===========================================================================
-- Wu Shu Ky Kickboxing — stop members writing to bookings directly
--
-- book_class() enforces capacity atomically with a row lock, but nothing forced
-- anyone to call it. The anon key is public, so a member could hit the REST
-- endpoint directly and:
--
--   1. INSERT a booking row — `bookings_insert_own` only checked
--      `user_id = auth.uid()` and never looked at the class capacity.
--   2. UPDATE their booking's class_id — `bookings_update_own_or_admin` had no
--      WITH CHECK, so Postgres reused the USING clause, which constrains
--      user_id but says nothing about class_id. A member could book a quiet
--      class and then move that row into a full one.
--   3. UPDATE their own status to 'attended', faking an attendance record.
--
-- A one-seat class was pushed to three bookings this way.
--
-- Fix, in two layers:
--   * Policies: members may read and cancel-by-delete their own bookings, but
--     may no longer INSERT or UPDATE them. Writes go through the SECURITY
--     DEFINER functions, which own the capacity rules.
--   * A trigger enforcing capacity on every INSERT/UPDATE regardless of who is
--     writing, so a future policy or admin script cannot reintroduce this.

-- ---------------------------------------------------------------------------
-- Layer 1: policies
-- ---------------------------------------------------------------------------

-- Members must use public.book_class(); it is SECURITY DEFINER and bypasses RLS.
drop policy if exists "bookings_insert_own" on public.bookings;

-- Members must use public.cancel_booking(). Admins retain UPDATE so they can
-- mark attendance; the WITH CHECK is explicit rather than inherited.
drop policy if exists "bookings_update_own_or_admin" on public.bookings;
drop policy if exists "bookings_admin_update" on public.bookings;
create policy "bookings_admin_update" on public.bookings
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- SELECT and DELETE stay as they were: deleting your own booking simply frees
-- the seat, which cannot overfill anything.

-- ---------------------------------------------------------------------------
-- Layer 2: capacity is a property of the table, not of one function
-- ---------------------------------------------------------------------------
create or replace function public.enforce_booking_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_taken    integer;
begin
  -- A cancelled row occupies no seat.
  if new.status = 'canceled' then
    return new;
  end if;

  -- Serialise against concurrent bookings for the same class.
  select capacity into v_capacity
  from public.classes
  where id = new.class_id
  for update;

  if v_capacity is null then
    raise exception 'Class not found';
  end if;

  -- Count everyone else holding a seat. Excluding this row by id makes the
  -- check correct for inserts, for re-activating a cancelled booking, and for
  -- updates that leave the class unchanged.
  select count(*) into v_taken
  from public.bookings
  where class_id = new.class_id
    and status <> 'canceled'
    and id <> new.id;

  if v_taken >= v_capacity then
    raise exception 'Class is full';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_enforce_capacity on public.bookings;
create trigger bookings_enforce_capacity
  before insert or update on public.bookings
  for each row execute function public.enforce_booking_capacity();


-- ===========================================================================
-- seed.sql
-- ===========================================================================
-- Wu Shu Ky Kickboxing — seed data
-- Safe to run repeatedly: plan names are unique (migration 0005) so the
-- on-conflict clause absorbs repeats, and classes are only seeded when the
-- classes table is empty.

insert into public.membership_plans (name, description, price_cents, currency, billing_interval)
values
  ('Drop-in', 'Pay-as-you-go access to a single class.', 1500, 'GBP', 'month'),
  ('Monthly', 'Unlimited classes, billed monthly.', 5900, 'GBP', 'month'),
  ('Annual', 'Unlimited classes, billed yearly (two months free).', 59000, 'GBP', 'year')
on conflict (name) do nothing;

-- Seed a handful of upcoming classes only if none exist yet.
insert into public.classes (title, description, instructor, level, starts_at, duration_minutes, capacity)
select *
from (
  values
    ('Foundations of Wushu', 'Stances, footwork, and basic forms.', 'Sifu Chen', 'beginner', now() + interval '1 day', 60, 20),
    ('Sparring & Application', 'Controlled sparring drills.', 'Sifu Lee', 'intermediate', now() + interval '2 day', 90, 16),
    ('Advanced Forms', 'Competition-level taolu practice.', 'Sifu Chen', 'advanced', now() + interval '3 day', 75, 12),
    ('Open Mat', 'All levels welcome.', 'Coach Park', 'all', now() + interval '5 day', 60, 30)
) as seed(title, description, instructor, level, starts_at, duration_minutes, capacity)
where not exists (select 1 from public.classes);
