\set ON_ERROR_STOP off
\pset pager off

insert into auth.users (id,email) values
  ('11111111-1111-1111-1111-111111111111','a@t'),
  ('22222222-2222-2222-2222-222222222222','b@t'),
  ('33333333-3333-3333-3333-333333333333','c@t');

-- A class with exactly ONE seat.
insert into public.classes (id,title,starts_at,capacity)
values ('aaaa0000-0000-0000-0000-000000000001','One Seat', now()+interval '2 day', 1);
-- A second class, also one seat, used as the "move target".
insert into public.classes (id,title,starts_at,capacity)
values ('aaaa0000-0000-0000-0000-000000000002','Other', now()+interval '3 day', 1);

create or replace function rep(label text, passed boolean)
returns void language plpgsql as $$
begin
  raise notice '% %', case when passed then '  OK  ' else '**HOLE' end, label;
end $$;

create or replace function become(u uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', u::text, false); end $$;

-- Fill the one seat legitimately, via the RPC.
do $$
declare r text;
begin
  perform become('11111111-1111-1111-1111-111111111111');
  set local role authenticated;
  select public.book_class('aaaa0000-0000-0000-0000-000000000001') into r;
  reset role;
  perform rep('setup: user A took the only seat -> '||r, r='booked');
end $$;

-- ATTACK 1 -------------------------------------------------------------
-- Skip book_class() entirely and INSERT a booking row directly. The
-- bookings_insert_own policy only checks user_id = auth.uid(); nothing
-- consults the class capacity.
do $$
declare n int;
begin
  perform become('22222222-2222-2222-2222-222222222222');
  set local role authenticated;
  begin
    insert into public.bookings (user_id, class_id)
    values ('22222222-2222-2222-2222-222222222222',
            'aaaa0000-0000-0000-0000-000000000001');
  exception when others then null;
  end;
  reset role;
  select count(*) into n from public.bookings
   where class_id='aaaa0000-0000-0000-0000-000000000001' and status<>'canceled';
  perform rep('ATTACK 1 direct INSERT cannot overfill a 1-seat class (now '||n||')', n<=1);
end $$;

-- ATTACK 2 -------------------------------------------------------------
-- Book the *other* class legitimately, then UPDATE the row's class_id to
-- point at the full class. bookings_update_own_or_admin has no WITH CHECK
-- restricting class_id.
do $$
declare n int; r text;
begin
  perform become('33333333-3333-3333-3333-333333333333');
  set local role authenticated;
  select public.book_class('aaaa0000-0000-0000-0000-000000000002') into r;
  begin
    update public.bookings
       set class_id='aaaa0000-0000-0000-0000-000000000001'
     where user_id='33333333-3333-3333-3333-333333333333';
  exception when others then null;
  end;
  reset role;
  select count(*) into n from public.bookings
   where class_id='aaaa0000-0000-0000-0000-000000000001' and status<>'canceled';
  perform rep('ATTACK 2 UPDATE class_id cannot smuggle into a full class (now '||n||')', n<=1);
end $$;

-- ATTACK 3 -------------------------------------------------------------
-- Mark yourself as having attended a class.
do $$
declare s text;
begin
  perform become('33333333-3333-3333-3333-333333333333');
  set local role authenticated;
  begin
    update public.bookings set status='attended'
     where user_id='33333333-3333-3333-3333-333333333333';
  exception when others then null;
  end;
  reset role;
  select status into s from public.bookings
   where user_id='33333333-3333-3333-3333-333333333333' limit 1;
  perform rep('ATTACK 3 member cannot self-mark attendance (status='||coalesce(s,'none')||')', s is distinct from 'attended');
end $$;

-- ATTACK 4 -------------------------------------------------------------
-- Grant yourself a free active membership.
do $$
declare n int;
begin
  perform become('11111111-1111-1111-1111-111111111111');
  set local role authenticated;
  begin
    insert into public.memberships (user_id, status)
    values ('11111111-1111-1111-1111-111111111111','active');
  exception when others then null;
  end;
  reset role;
  select count(*) into n from public.memberships
   where user_id='11111111-1111-1111-1111-111111111111';
  perform rep('ATTACK 4 member cannot grant themselves a membership (rows='||n||')', n=0);
end $$;

-- ATTACK 5 -------------------------------------------------------------
-- Anonymous read of pricing plans (policy is `using (true)`).
do $$
declare n int;
begin
  perform set_config('request.jwt.claim.sub','',false);
  set local role anon;
  select count(*) into n from public.membership_plans;
  reset role;
  perform rep('ATTACK 5 anon reading plans (sees '||n||') — intended for pricing?', true);
end $$;

-- ATTACK 6 -------------------------------------------------------------
-- Cancel somebody else's booking.
do $$
declare s text;
begin
  perform become('22222222-2222-2222-2222-222222222222');
  set local role authenticated;
  begin
    perform public.cancel_booking('aaaa0000-0000-0000-0000-000000000001');
  exception when others then null;
  end;
  reset role;
  select status into s from public.bookings
   where user_id='11111111-1111-1111-1111-111111111111'
     and class_id='aaaa0000-0000-0000-0000-000000000001';
  perform rep('ATTACK 6 cannot cancel another member booking (theirs='||coalesce(s,'gone')||')', s='booked');
end $$;

-- ATTACK 7 -------------------------------------------------------------
-- Delete a class as a member (would cascade-delete everyone's bookings).
do $$
declare n int;
begin
  perform become('22222222-2222-2222-2222-222222222222');
  set local role authenticated;
  begin
    delete from public.classes where id='aaaa0000-0000-0000-0000-000000000002';
  exception when others then null;
  end;
  reset role;
  select count(*) into n from public.classes where id='aaaa0000-0000-0000-0000-000000000002';
  perform rep('ATTACK 7 member cannot delete a class', n=1);
end $$;
