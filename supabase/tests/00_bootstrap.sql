-- Emulate the parts of a Supabase project the migrations depend on, so the
-- real migration files can be applied unmodified and RLS exercised as a member.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb
);

-- Supabase's auth.uid() reads the sub claim from the request JWT. We drive it
-- with a session GUC so tests can "become" a given user.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- Roles Supabase creates.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;

-- Supabase grants table DML to anon/authenticated by default; RLS is what
-- actually constrains access. Mirror that so the policies are the thing under
-- test, not missing grants.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant execute on functions to anon, authenticated;
