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
