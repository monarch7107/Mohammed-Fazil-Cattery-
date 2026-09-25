-- ============================================================================
-- Mohammed Fazil Cattery — admin account setup (run once in the SQL editor)
-- ============================================================================
-- The application itself uses ONLY the publishable key, so admin accounts
-- are provisioned from the Supabase SQL editor (postgres role), not from an
-- app script: creating Auth users and the matching admins rows is a trusted,
-- one-time operation that must never be possible through the publishable
-- client or the website.
--
-- HOW TO USE
--   1. Supabase Dashboard → Authentication → Users → "Add user" →
--      "Create new user" for EACH of the two admin accounts
--      (email + a strong password; tick "Auto Confirm User").
--   2. Supabase Dashboard → SQL Editor → paste this file → replace the two
--      placeholder emails below with the SAME emails → Run.
--   3. Done. (Idempotent: safe to re-run; it repairs/refreshes the rows.)
--
-- Never expose the generated passwords in chat, issues, or the repository.
-- ============================================================================

-- ① Registry row for the Administrator account --------------------------------
insert into public.admins (id, email, name, role, active)
select id, email, 'Administrator', 'admin', true
from auth.users
where email = 'REPLACE_WITH_ADMIN_EMAIL@example.com'
on conflict (id) do update
  set email     = excluded.email,
      name      = excluded.name,
      role      = 'admin',
      active    = true,
      updated_at = now();

-- ② Registry row for the Owner account ----------------------------------------
insert into public.admins (id, email, name, role, active)
select id, email, 'Owner', 'admin', true
from auth.users
where email = 'REPLACE_WITH_OWNER_EMAIL@example.com'
on conflict (id) do update
  set email     = excluded.email,
      name      = excluded.name,
      role      = 'admin',
      active    = true,
      updated_at = now();
