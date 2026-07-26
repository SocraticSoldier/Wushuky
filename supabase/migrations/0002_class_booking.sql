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
