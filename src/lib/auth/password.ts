import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      KEY_LENGTH,
      { N: COST, r: BLOCK_SIZE, p: PARALLELISM, maxmem: 128 * 1024 * 1024 },
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });
}

/** scrypt$<N>.<r>.<p>$<salt hex>$<hash hex> */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${COST}.${BLOCK_SIZE}.${PARALLELISM}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  try {
    const [, params, saltHex, hashHex] = stored.split("$");
    if (!params || !saltHex || !hashHex) return false;
    const [n, r, p] = params.split(".").map(Number);
    if (!n || !r || !p) return false;

    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");

    const actual = await new Promise<Buffer>((resolve, reject) => {
      scrypt(
        password.normalize("NFKC"),
        salt,
        expected.length,
        { N: n, r, p, maxmem: 128 * 1024 * 1024 },
        (err, key) => (err ? reject(err) : resolve(key))
      );
    });

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Constant-time-ish dummy verification to reduce user enumeration timing signal. */
export async function dummyVerify(): Promise<void> {
  await verifyPassword("not-a-real-password", `scrypt$${COST}.${BLOCK_SIZE}.${PARALLELISM}$${"00".repeat(16)}$${"00".repeat(64)}`);
}
