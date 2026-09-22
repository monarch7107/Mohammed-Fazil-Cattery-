#!/usr/bin/env node
/**
 * Generate a scrypt password hash for ADMIN_PASSWORD_HASH.
 *
 *   node scripts/hash-password.mjs "your-strong-password"
 *
 * The plaintext is never stored — only the derived hash.
 */
import { randomBytes, scrypt } from "node:crypto";

const password = process.argv[2];

if (!password || password.length < 8) {
  console.error("Usage: node scripts/hash-password.mjs \"a-password-of-at-least-8-chars\"");
  process.exit(1);
}

const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;
const salt = randomBytes(16);

scrypt(
  password.normalize("NFKC"),
  salt,
  KEY_LENGTH,
  { N: COST, r: BLOCK_SIZE, p: PARALLELISM, maxmem: 128 * 1024 * 1024 },
  (err, key) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    const hash = `scrypt$${COST}.${BLOCK_SIZE}.${PARALLELISM}$${salt.toString("hex")}$${key.toString("hex")}`;
    console.log("\nADMIN_PASSWORD_HASH=" + hash + "\n");
    console.log("Add it to .env.local (or your hosting environment variables).\n");
  }
);
