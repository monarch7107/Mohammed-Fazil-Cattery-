-- ============================================================================
-- Mohammed Fazil Cattery — PostgreSQL schema + Row Level Security
-- PUBLISHABLE-KEY-ONLY ARCHITECTURE (no secret/service_role key in the app)
-- ============================================================================
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
--
-- Security model (the browser is untrusted; only the two NEXT_PUBLIC_
-- Supabase values are used by the application):
--
--   • Public visitors  → `anon` role, read-only SELECT on content tables.
--   • Normal auth users → `authenticated` role, still read-only: admin
--     rights never come from being signed in.
--   • Admins           → a Supabase Auth user whose auth.uid() owns an
--     active row in public.admins (role='admin', active=true). Identified
--     ONLY by the security-definer helper public.is_cattery_admin(), which
--     avoids RLS recursion and cannot be spoofed by client metadata.
--   • raw_user_meta_data is NEVER used for authorization.
--
-- Every write policy pairs USING with WITH CHECK. The admins registry is
-- invisible to every client role; rows are created from the dashboard's
-- SQL editor while signed in as postgres (see supabase/admin-setup.sql).
--
-- Images live in Cloudinary; only URLs + public_ids are stored here.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- public.is_cattery_admin() — the single authorization primitive
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER + locked search_path: evaluates the admins table with the
-- function owner's rights, so policies on other tables can call it without
-- recursing into admins' own RLS. immutable-in-request identity (auth.uid()).
create or replace function public.is_cattery_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where a.id = auth.uid()
      and a.active is true
      and a.role = 'admin'
  );
$$;

revoke all on function public.is_cattery_admin() from public;
grant execute on function public.is_cattery_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- admins — mirrors Supabase Auth users, managed by trusted setup only
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  name        text not null default 'Administrator',
  role        text not null default 'admin' check (role in ('admin')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Clients get NO policy on admins: anon/authenticated cannot SELECT, INSERT,
-- UPDATE or DELETE any of it (default-deny under RLS). Not even admins can
-- read or alter the registry from the API — promotion/demotion happens only
-- in the SQL editor or supabase/admin-setup.sql, which run as postgres.
-- (The definer function above is the sole reader, as the table owner.)

-- ---------------------------------------------------------------------------
-- kittens
-- ---------------------------------------------------------------------------
create table if not exists public.kittens (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  breed         text not null default 'Persian',
  gender        text not null default 'unknown' check (gender in ('male', 'female', 'unknown')),
  date_of_birth date,
  description   text not null default '',
  status        text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  price         numeric check (price is null or price >= 0),
  images        jsonb not null default '[]'::jsonb,
  image_ids     jsonb not null default '[]'::jsonb,
  featured      boolean not null default false,
  placeholder   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists kittens_status_idx   on public.kittens (status);
create index if not exists kittens_featured_idx on public.kittens (featured);
create index if not exists kittens_created_idx  on public.kittens (created_at desc);

alter table public.kittens enable row level security;

-- Public read (everyone, including anon).
drop policy if exists "kittens public read" on public.kittens;
create policy "kittens public read"
  on public.kittens for select
  using (true);

-- Admin writes: separate per-action policies, all USING + WITH CHECK.
drop policy if exists "kittens admin insert" on public.kittens;
create policy "kittens admin insert"
  on public.kittens for insert to authenticated
  with check (public.is_cattery_admin());

drop policy if exists "kittens admin update" on public.kittens;
create policy "kittens admin update"
  on public.kittens for update to authenticated
  using (public.is_cattery_admin())
  with check (public.is_cattery_admin());

drop policy if exists "kittens admin delete" on public.kittens;
create policy "kittens admin delete"
  on public.kittens for delete to authenticated
  using (public.is_cattery_admin());

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  animal      text not null check (animal in ('cat', 'dog')),
  category    text not null check (category in ('dry', 'wet')),
  food_type   text not null default '',
  brand       text,
  pack_size   text,
  price       numeric check (price is null or price >= 0),
  description text not null default '',
  image       text,
  image_id    text,
  available   boolean not null default true,
  placeholder boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_animal_idx   on public.products (animal);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_created_idx  on public.products (created_at desc);

alter table public.products enable row level security;

drop policy if exists "products public read" on public.products;
create policy "products public read"
  on public.products for select
  using (true);

drop policy if exists "products admin insert" on public.products;
create policy "products admin insert"
  on public.products for insert to authenticated
  with check (public.is_cattery_admin());

drop policy if exists "products admin update" on public.products;
create policy "products admin update"
  on public.products for update to authenticated
  using (public.is_cattery_admin())
  with check (public.is_cattery_admin());

drop policy if exists "products admin delete" on public.products;
create policy "products admin delete"
  on public.products for delete to authenticated
  using (public.is_cattery_admin());

-- ---------------------------------------------------------------------------
-- gallery
-- ---------------------------------------------------------------------------
create table if not exists public.gallery (
  id          uuid primary key default gen_random_uuid(),
  image       text,
  image_id    text,
  category    text not null default 'cattery' check (category in ('kittens', 'cats', 'pet-food', 'cattery')),
  caption     text not null default '',
  sort_order  integer not null default 0,
  placeholder boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists gallery_category_idx on public.gallery (category);
create index if not exists gallery_sort_idx     on public.gallery (sort_order);

alter table public.gallery enable row level security;

drop policy if exists "gallery public read" on public.gallery;
create policy "gallery public read"
  on public.gallery for select
  using (true);

drop policy if exists "gallery admin insert" on public.gallery;
create policy "gallery admin insert"
  on public.gallery for insert to authenticated
  with check (public.is_cattery_admin());

drop policy if exists "gallery admin update" on public.gallery;
create policy "gallery admin update"
  on public.gallery for update to authenticated
  using (public.is_cattery_admin())
  with check (public.is_cattery_admin());

drop policy if exists "gallery admin delete" on public.gallery;
create policy "gallery admin delete"
  on public.gallery for delete to authenticated
  using (public.is_cattery_admin());

-- ---------------------------------------------------------------------------
-- updated_at maintenance trigger
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists kittens_touch_updated_at on public.kittens;
create trigger kittens_touch_updated_at
  before update on public.kittens
  for each row execute function public.touch_updated_at();

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists admins_touch_updated_at on public.admins;
create trigger admins_touch_updated_at
  before update on public.admins
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Optional placeholder seed (safe to re-run; skips when data already exists).
-- Set SEED_ON_EMPTY=false in the app env to keep the app from seeding.
-- ---------------------------------------------------------------------------
do $$
begin
  if (select count(*) from public.kittens) = 0
     and (select count(*) from public.products) = 0
     and (select count(*) from public.gallery) = 0 then
    insert into public.kittens (name, breed, gender, status, featured, placeholder, description)
    values
      ('Persian Kitten — Placeholder 01', 'Persian', 'male',   'available', true,  true,
       'Placeholder record. Replace it from Admin → Kittens with the real kitten details.'),
      ('Persian Kitten — Placeholder 02', 'Persian', 'female', 'available', true,  true,
       'Placeholder record. Replace it from Admin → Kittens with the real kitten details.'),
      ('Persian Kitten — Placeholder 03', 'Persian', 'unknown','reserved',  false, true,
       'Placeholder record. Replace it from Admin → Kittens with the real kitten details.'),
      ('Persian Kitten — Placeholder 04', 'Persian', 'male',   'sold',      false, true,
       'Placeholder record. Replace it from Admin → Kittens with the real kitten details.');

    insert into public.products (name, animal, category, food_type, placeholder, description)
    values
      ('Cat Food — Placeholder (Dry)', 'cat', 'dry', 'Dry Food', true,
       'Placeholder record. Replace it from Admin → Products with the real details.'),
      ('Cat Food — Placeholder (Wet)', 'cat', 'wet', 'Wet Food', true,
       'Placeholder record. Replace it from Admin → Products with the real details.'),
      ('Dog Food — Placeholder (Dry)', 'dog', 'dry', 'Dry Food', true,
       'Placeholder record. Replace it from Admin → Products with the real details.'),
      ('Dog Food — Placeholder (Wet)', 'dog', 'wet', 'Wet Food', true,
       'Placeholder record. Replace it from Admin → Products with the real details.');

    insert into public.gallery (category, caption, sort_order, placeholder)
    values
      ('kittens',  'Kitten Photo — Placeholder',       0, true),
      ('cats',     'Persian Cat Image — Placeholder',  1, true),
      ('pet-food', 'Pet Food Product — Placeholder',   2, true),
      ('cattery',  'Cattery Photo — Placeholder',      3, true),
      ('kittens',  'Kitten Photo — Placeholder',       4, true),
      ('cats',     'Persian Cat Image — Placeholder',  5, true);
  end if;
end
$$;
