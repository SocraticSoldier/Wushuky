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
