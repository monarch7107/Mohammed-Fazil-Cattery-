/**
 * Environment-configured admin accounts.
 *
 * Two accounts are supported out of the box:
 *   - ADMIN_EMAIL      + ADMIN_PASSWORD_HASH      → "Administrator"
 *   - OWNER_EMAIL      + OWNER_PASSWORD_HASH      → "Owner"
 *
 * Passwords are never stored in plaintext — only scrypt hashes generated with
 * scripts/hash-password.mjs. The database `users` collection always takes
 * precedence over these fallbacks.
 */

export interface EnvAdmin {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

function account(
  id: string,
  name: string,
  email: string | undefined,
  hash: string | undefined
): EnvAdmin | null {
  const trimmedEmail = email?.trim().toLowerCase();
  const trimmedHash = hash?.trim();
  if (!trimmedEmail || !trimmedHash) return null;
  return { id, email: trimmedEmail, name, passwordHash: trimmedHash };
}

/** Parsed once per process; the preview reboots when env vars change. */
export function envAdmins(): EnvAdmin[] {
  return [
    account("env-admin", "Administrator", process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD_HASH),
    account("env-owner", "Owner", process.env.OWNER_EMAIL, process.env.OWNER_PASSWORD_HASH),
  ].filter((entry): entry is EnvAdmin => entry !== null);
}
