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
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_admin());

-- membership_plans: anyone may read active plans; admins manage.
create policy "plans_select_all" on public.membership_plans
  for select using (true);
create policy "plans_admin_write" on public.membership_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- memberships: users read their own; admins manage all.
create policy "memberships_select_own_or_admin" on public.memberships
  for select using (user_id = auth.uid() or public.is_admin());
create policy "memberships_admin_write" on public.memberships
  for all using (public.is_admin()) with check (public.is_admin());

-- classes: any authenticated user may read; admins manage.
create policy "classes_select_authenticated" on public.classes
  for select using (auth.uid() is not null);
create policy "classes_admin_write" on public.classes
  for all using (public.is_admin()) with check (public.is_admin());

-- bookings: users manage their own; admins read all.
create policy "bookings_select_own_or_admin" on public.bookings
  for select using (user_id = auth.uid() or public.is_admin());
create policy "bookings_insert_own" on public.bookings
  for insert with check (user_id = auth.uid());
create policy "bookings_update_own_or_admin" on public.bookings
  for update using (user_id = auth.uid() or public.is_admin());
create policy "bookings_delete_own_or_admin" on public.bookings
  for delete using (user_id = auth.uid() or public.is_admin());
