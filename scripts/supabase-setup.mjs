#!/usr/bin/env node
/**
 * Supabase setup for Mohammed Fazil Cattery.
 *
 * Creates/updates EXACTLY the provided admin accounts (idempotent — updates
 * by email lookup, never duplicates) and their `admins` rows. Run it once,
 * locally, with the server-side secret key — never in CI or on deploy.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SECRET_KEY=sb_secret_...            (or SUPABASE_SERVICE_ROLE_KEY)
 *   ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="..." \
 *   OWNER_EMAIL="owner@example.com" OWNER_PASSWORD="..." \
 *   node scripts/supabase-setup.mjs
 *
 * Passwords can also be passed as --admin-password / --owner-password.
 * They are used at run time only — never stored in the repo.
 *
 * After running this, execute supabase/schema.sql in the SQL editor if you
 * have not already (it creates the tables + RLS this script depends on).
 */
import { createClient } from "@supabase/supabase-js";

const arg = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : undefined;
};
const env = (key) => process.env[key]?.trim();

const url = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
const key = env("SUPABASE_SECRET_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !key) {
  console.error(
    "\nMissing Supabase credentials.\n" +
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).\n" +
      "Supabase Dashboard → Project Settings → API.\n"
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const accounts = [
  { label: "Admin 1 (Administrator)", email: env("ADMIN_EMAIL") ?? arg("admin-email"), password: env("ADMIN_PASSWORD") ?? arg("admin-password") },
  { label: "Admin 2 (Owner)", email: env("OWNER_EMAIL") ?? arg("owner-email"), password: env("OWNER_PASSWORD") ?? arg("owner-password") },
].filter((account) => account.email && account.password);

if (accounts.length === 0) {
  console.error(
    "\nNo admin accounts provided.\n" +
      "Set ADMIN_EMAIL + ADMIN_PASSWORD and OWNER_EMAIL + OWNER_PASSWORD\n" +
      "(or pass --admin-email/--admin-password/--owner-email/--owner-password).\n" +
      "Passwords are used at run time only — they are never stored in the repo.\n"
  );
  process.exit(1);
}

/* ---------------- 1: the two admin accounts ---------------- */

for (const account of accounts) {
  const email = account.email.trim().toLowerCase();

  // Look up by email via the page-size-1 admin list (no create-if-missing
  // duplication risk: we always reuse the existing user when present).
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 500,
  });
  if (listError) {
    console.error(`✗ Could not list users: ${listError.message}`);
    process.exit(1);
  }
  const existing = listData.users.find((u) => (u.email ?? "").toLowerCase() === email);

  let userId = existing?.id;
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: account.password,
      email_confirm: true,
    });
    if (error) {
      console.error(`✗ ${account.label}: could not update ${email}: ${error.message}`);
      process.exit(1);
    }
    console.log(`• ${account.label}: ${email} already exists — password refreshed`);
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password: account.password,
      email_confirm: true,
    });
    if (error || !created.user) {
      console.error(`✗ ${account.label}: could not create ${email}: ${error?.message}`);
      process.exit(1);
    }
    userId = created.user.id;
    console.log(`✓ ${account.label}: created ${email}`);
  }

  /* ---------------- 2: the admins registry row ---------------- */

  const { error: upsertError } = await supabase.from("admins").upsert(
    {
      id: userId,
      email,
      name: account.label.includes("Owner") ? "Owner" : "Administrator",
      role: "admin",
      active: true,
    },
    { onConflict: "id" }
  );
  if (upsertError) {
    console.error(
      `✗ Could not write admins row for ${email}: ${upsertError.message}\n` +
        "  Did you run supabase/schema.sql first?"
    );
    process.exit(1);
  }
  console.log(`✓ ${account.label}: admins row ready (${userId})`);
}

console.log(
  "\nSupabase setup complete.\n" +
    "Both accounts can now sign in at /admin and manage the site.\n"
);
