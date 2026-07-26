-- Wu Shu Ky Kickboxing — seed data
-- Safe to run repeatedly: plans are keyed by name, classes are only seeded when
-- the classes table is empty.

insert into public.membership_plans (name, description, price_cents, currency, billing_interval)
values
  ('Drop-in', 'Pay-as-you-go access to a single class.', 1500, 'GBP', 'month'),
  ('Monthly', 'Unlimited classes, billed monthly.', 5900, 'GBP', 'month'),
  ('Annual', 'Unlimited classes, billed yearly (two months free).', 59000, 'GBP', 'year')
on conflict do nothing;

-- Seed a handful of upcoming classes only if none exist yet.
insert into public.classes (title, description, instructor, level, starts_at, duration_minutes, capacity)
select *
from (
  values
    ('Foundations of Wushu', 'Stances, footwork, and basic forms.', 'Sifu Chen', 'beginner', now() + interval '1 day', 60, 20),
    ('Sparring & Application', 'Controlled sparring drills.', 'Sifu Lee', 'intermediate', now() + interval '2 day', 90, 16),
    ('Advanced Forms', 'Competition-level taolu practice.', 'Sifu Chen', 'advanced', now() + interval '3 day', 75, 12),
    ('Open Mat', 'All levels welcome.', 'Coach Park', 'all', now() + interval '5 day', 60, 30)
) as seed(title, description, instructor, level, starts_at, duration_minutes, capacity)
where not exists (select 1 from public.classes);
