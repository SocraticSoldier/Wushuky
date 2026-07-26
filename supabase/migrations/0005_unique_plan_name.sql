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
