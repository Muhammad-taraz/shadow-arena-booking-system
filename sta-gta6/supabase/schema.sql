-- WARNING: this resets the booking tables. Run it once on an empty/test project.
drop table if exists slot_locks;
drop table if exists bookings;
create table bookings (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  name text not null, phone text not null,
  date date not null, start_hour int not null, duration int not null,
  consoles int[] not null,
  total int not null, paid_now int not null,
  plan text not null check (plan in ('half','full')),
  method text not null, sender text, screenshot_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
-- One row per console per hour. The primary key makes double booking impossible.
create table slot_locks (
  date date not null, hour int not null, console int not null,
  booking_id uuid not null references bookings(id) on delete cascade,
  primary key (date, hour, console)
);
alter table bookings enable row level security;
alter table slot_locks enable row level security;
grant all on table bookings, slot_locks to service_role;
insert into storage.buckets (id, name, public) values ('payments', 'payments', false) on conflict (id) do nothing;
