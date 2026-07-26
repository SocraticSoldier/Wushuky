\set ON_ERROR_STOP off
\pset pager off

-- ---------------------------------------------------------------------------
-- Fixtures (as superuser, bypassing RLS)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'member@test'),
  ('22222222-2222-2222-2222-222222222222', 'other@test'),
  ('33333333-3333-3333-3333-333333333333', 'third@test'),
  ('99999999-9999-9999-9999-999999999999', 'admin@test');

update public.profiles set role = 'admin'
  where id = '99999999-9999-9999-9999-999999999999';

insert into public.classes (id, title, starts_at, capacity)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Tiny Class',
        now() + interval '2 day', 2);

create or replace function test_report(label text, passed boolean)
returns void language plpgsql as $$
begin
  raise notice '% %', case when passed then '  PASS' else '**FAIL' end, label;
end $$;

-- Helper: run as a given authenticated user.
create or replace function become(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', u::text, false);
end $$;

-- ---------------------------------------------------------------------------
-- SECURITY: privilege escalation (the bug migration 0003 fixes)
-- ---------------------------------------------------------------------------
do $$
declare escalated boolean;
begin
  perform become('11111111-1111-1111-1111-111111111111');
  set local role authenticated;
  begin
    update public.profiles set role = 'admin'
      where id = '11111111-1111-1111-1111-111111111111';
    -- If no exception, check whether it actually took effect.
    reset role;
    select role = 'admin' into escalated from public.profiles
      where id = '11111111-1111-1111-1111-111111111111';
    perform test_report('member CANNOT self-promote to admin', not escalated);
  exception when others then
    reset role;
    perform test_report('member CANNOT self-promote to admin (blocked: '
      || substr(SQLERRM, 1, 40) || ')', true);
  end;
end $$;

-- ---------------------------------------------------------------------------
-- SECURITY: profile isolation
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  perform become('11111111-1111-1111-1111-111111111111');
  set local role authenticated;
  select count(*) into n from public.profiles
    where id = '22222222-2222-2222-2222-222222222222';
  reset role;
  perform test_report('member cannot read another member profile', n = 0);
end $$;

do $$
declare n int;
begin
  perform become('11111111-1111-1111-1111-111111111111');
  set local role authenticated;
  select count(*) into n from public.profiles
    where id = '11111111-1111-1111-1111-111111111111';
  reset role;
  perform test_report('member CAN read own profile', n = 1);
end $$;

do $$
declare nm text;
begin
  perform become('11111111-1111-1111-1111-111111111111');
  set local role authenticated;
  update public.profiles set full_name = 'Renamed'
    where id = '11111111-1111-1111-1111-111111111111';
  reset role;
  select full_name into nm from public.profiles
    where id = '11111111-1111-1111-1111-111111111111';
  perform test_report('member CAN edit own name', nm = 'Renamed');
end $$;

-- ---------------------------------------------------------------------------
-- SECURITY: classes are admin-write only
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  perform become('11111111-1111-1111-1111-111111111111');
  set local role authenticated;
  begin
    insert into public.classes (title, starts_at) values ('Hacked', now());
    reset role;
    select count(*) into n from public.classes where title = 'Hacked';
    perform test_report('member CANNOT create a class', n = 0);
  exception when others then
    reset role;
    perform test_report('member CANNOT create a class (blocked)', true);
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Booking: happy path, idempotency, capacity
-- ---------------------------------------------------------------------------
do $$
declare r text;
begin
  perform become('11111111-1111-1111-1111-111111111111');
  set local role authenticated;
  select public.book_class('aaaaaaaa-0000-0000-0000-000000000001') into r;
  reset role;
  perform test_report('member can book a class -> ' || r, r = 'booked');
end $$;

do $$
declare r text; n int;
begin
  perform become('11111111-1111-1111-1111-111111111111');
  set local role authenticated;
  select public.book_class('aaaaaaaa-0000-0000-0000-000000000001') into r;
  reset role;
  select count(*) into n from public.bookings
    where class_id = 'aaaaaaaa-0000-0000-0000-000000000001'
      and user_id = '11111111-1111-1111-1111-111111111111';
  perform test_report('double-booking is idempotent (1 row)', r = 'booked' and n = 1);
end $$;

do $$
declare r text;
begin
  perform become('22222222-2222-2222-2222-222222222222');
  set local role authenticated;
  select public.book_class('aaaaaaaa-0000-0000-0000-000000000001') into r;
  reset role;
  perform test_report('second member fills the class -> ' || r, r = 'booked');
end $$;

do $$
declare r text;
begin
  perform become('33333333-3333-3333-3333-333333333333');
  set local role authenticated;
  select public.book_class('aaaaaaaa-0000-0000-0000-000000000001') into r;
  reset role;
  perform test_report('CAPACITY ENFORCED: third member gets -> ' || r, r = 'full');
end $$;

-- ---------------------------------------------------------------------------
-- SECURITY: booking isolation
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  perform become('33333333-3333-3333-3333-333333333333');
  set local role authenticated;
  select count(*) into n from public.bookings;
  reset role;
  perform test_report('member cannot read others bookings (sees ' || n || ')', n = 0);
end $$;

do $$
declare n int;
begin
  perform become('33333333-3333-3333-3333-333333333333');
  set local role authenticated;
  begin
    insert into public.bookings (user_id, class_id)
      values ('11111111-1111-1111-1111-111111111111',
              'aaaaaaaa-0000-0000-0000-000000000001');
    reset role;
    select count(*) into n from public.bookings
      where user_id = '11111111-1111-1111-1111-111111111111';
    perform test_report('member CANNOT book on behalf of another user', n = 1);
  exception when others then
    reset role;
    perform test_report('member CANNOT book on behalf of another user (blocked)', true);
  end;
end $$;

-- Cancelling frees a spot.
do $$
declare r text;
begin
  perform become('11111111-1111-1111-1111-111111111111');
  set local role authenticated;
  perform public.cancel_booking('aaaaaaaa-0000-0000-0000-000000000001');
  reset role;
  perform become('33333333-3333-3333-3333-333333333333');
  set local role authenticated;
  select public.book_class('aaaaaaaa-0000-0000-0000-000000000001') into r;
  reset role;
  perform test_report('cancelling frees a spot -> ' || r, r = 'booked');
end $$;

-- ---------------------------------------------------------------------------
-- Admin capabilities
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  perform become('99999999-9999-9999-9999-999999999999');
  set local role authenticated;
  select count(*) into n from public.profiles;
  reset role;
  perform test_report('admin CAN read all profiles (sees ' || n || ')', n = 4);
end $$;

do $$
declare ok boolean;
begin
  perform become('99999999-9999-9999-9999-999999999999');
  set local role authenticated;
  update public.profiles set role = 'admin'
    where id = '22222222-2222-2222-2222-222222222222';
  reset role;
  select role = 'admin' into ok from public.profiles
    where id = '22222222-2222-2222-2222-222222222222';
  perform test_report('admin CAN change a role', ok);
end $$;

do $$
declare n int;
begin
  perform become('99999999-9999-9999-9999-999999999999');
  set local role authenticated;
  insert into public.classes (title, starts_at) values ('Admin Made', now());
  reset role;
  select count(*) into n from public.classes where title = 'Admin Made';
  perform test_report('admin CAN create a class', n = 1);
end $$;

-- ---------------------------------------------------------------------------
-- Anonymous access
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  perform set_config('request.jwt.claim.sub', '', false);
  set local role anon;
  select count(*) into n from public.classes;
  reset role;
  perform test_report('anon cannot read classes (sees ' || n || ')', n = 0);
end $$;
