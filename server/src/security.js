/**
 * security.js
 * --------------------------------------------------------------------------
 * Small security helpers.
 *
 *  - Passwords are stored as scrypt hashes with a random salt (never as text).
 *  - Login tokens and email-link tokens are random, and only their SHA-256
 *    hash is stored. Someone who copies the database cannot use them.
 *  - Comparisons use timingSafeEqual, so timing gives nothing away.
 */
import crypto from 'node:crypto';

/** Hashes a password with scrypt. Returns { salt, hash } as hex. */
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return { salt, hash };
}

/** True when `password` matches the stored salt + hash. */
export function checkPassword(password, salt, hash) {
  const test = Buffer.from(hashPassword(password, salt).hash, 'hex');
  const real = Buffer.from(hash, 'hex');
  return test.length === real.length && crypto.timingSafeEqual(test, real);
}

/** A new random token (sent to the app or put in an email link). */
export function newToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/** The hash of a token: this is what we store. */
export function tokenHash(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/** Compares two strings in constant time. */
export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/**
 * A friend code like "COMET-4821": easy to read out loud and type.
 * Children add friends by code only - there is no way to search or browse
 * other children.
 */
const CODE_WORDS = ['STAR', 'MOON', 'COMET', 'ROCKET', 'PLANET', 'NOVA', 'ORBIT', 'LUNA', 'SOLAR', 'GALAXY'];
export function newFriendCode() {
  const word = CODE_WORDS[crypto.randomInt(CODE_WORDS.length)];
  const digits = String(crypto.randomInt(10000)).padStart(4, '0');
  return `${word}-${digits}`;
}

/**
 * A tiny in-memory rate limiter: at most `max` actions per `windowMs` for
 * each key (e.g. an IP address). Protects against password guessing and
 * email spam.
 */
export class RateLimiter {
  constructor(max, windowMs) {
    this.max = max;
    this.windowMs = windowMs;
    this.hits = new Map();
  }

  /** Returns true when the action is allowed (and counts it). */
  allow(key, now = Date.now()) {
    const list = (this.hits.get(key) ?? []).filter(t => now - t < this.windowMs);
    if (list.length >= this.max) {
      this.hits.set(key, list);
      return false;
    }
    list.push(now);
    this.hits.set(key, list);
    return true;
  }
}
