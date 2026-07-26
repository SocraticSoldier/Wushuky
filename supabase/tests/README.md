# RLS / policy tests

These exercise the migrations against a plain PostgreSQL instance — no Supabase
CLI or Docker required. `00_bootstrap.sql` recreates just enough of a Supabase
project (the `auth` schema, `auth.users`, `auth.uid()`, and the `anon` /
`authenticated` / `service_role` roles) that the real migration files apply
unmodified and RLS can be exercised as an actual member.

They cover the things that are easy to get wrong and impossible to catch with
type-checking: privilege escalation, cross-tenant reads, and booking capacity
under concurrency.

## Running them

```bash
sudo apt-get install -y postgresql
sudo pg_ctlcluster 16 main start

createdb() { sudo -u postgres psql -qc "drop database if exists wushukai;" \
                                  -c "create database wushukai;"; }
createdb
sudo -u postgres psql -q -d wushukai < supabase/tests/00_bootstrap.sql
for f in supabase/migrations/*.sql; do
  sudo -u postgres psql -q -v ON_ERROR_STOP=1 -d wushukai < "$f"
done
sudo -u postgres psql -q -d wushukai < supabase/tests/rls_test.sql \
  2>&1 | grep -E "PASS|FAIL"
```

Run against a **freshly created** database — the fixtures insert fixed UUIDs and
will trip unique constraints on a second run.

## What is covered

| Area | Assertion |
| --- | --- |
| Escalation | a member cannot set their own `role` to `admin` |
| Bootstrap | privileged direct access (SQL editor) *can* create the first admin |
| Isolation | a member cannot read another member's profile or bookings |
| Ownership | a member cannot create a booking for someone else |
| Admin | admins can read all profiles, change roles, and manage classes |
| Capacity | a full class returns `full`; cancelling frees the spot |
| Anonymous | signed-out callers read nothing |

## Concurrency

Capacity enforcement relies on the `for update` row lock in `book_class`. To
verify it holds under contention, fire N concurrent bookings at a class with a
smaller capacity and confirm the booking count equals the capacity exactly —
12 concurrent attempts against a capacity-3 class must yield exactly 3.
