-- Wushu Kai — close a privilege-escalation hole on public.profiles
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
