import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const PARAMS = { N: 16384, r: 8, p: 1 };

/** Hashes a password with scrypt → "scrypt$<salt>$<hash>" (base64). */
export const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH, PARAMS);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
};

/** Constant-time password check. */
export const verifyPassword = async (password, stored) => {
  const [scheme, saltB64, hashB64] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, PARAMS);
  return crypto.timingSafeEqual(actual, expected);
};

// Used when the username does not exist, so response time doesn't reveal it.
export const DUMMY_HASH =
  "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
