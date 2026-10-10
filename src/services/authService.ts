/**
 * authService.ts
 * --------------------------------------------------------------------------
 * The "basic, protected log-in system" from the brief.
 *
 * A grown-up registers the child with a Username, an Email and a Password.
 * Accounts are kept on this device only (see storage.ts).
 *
 * How the password is protected
 * -----------------------------
 *  - The password itself is NEVER saved.
 *  - Instead we save a "hash": the password is mixed with a random "salt"
 *    and run through PBKDF2-SHA256 thousands of times. You cannot turn the
 *    hash back into the password.
 *  - To log in, we hash the typed password the same way and compare the two
 *    hashes. The compare takes the same time whether the first letter or the
 *    last letter is wrong (so timing gives nothing away).
 *  - After 5 wrong passwords in a row, that username has to wait 30 seconds.
 *  - Error messages never say WHICH part was wrong ("Wrong username or
 *    password"), so nobody can find out which usernames exist.
 *
 * Good enough for a demo on one device. Before a real launch, accounts should
 * move to a server (and the device data should be encrypted) - see README.
 *
 * Speed: on Android the hashing is done by the phone's own built-in
 * PBKDF2 (our small native module, android/.../PasswordHasherModule.kt),
 * which takes a moment. Where that is not available (old phones, tests,
 * the browser preview) the same maths runs in JavaScript with @noble/hashes
 * (small, audited). Both give exactly the same result.
 */
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { NativeModules } from 'react-native';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

import {
  deviceStorage,
  type KeyValueStore,
  readJson,
  writeJson,
} from './storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One saved account, exactly as it is stored on the device. */
export interface StoredAccount {
  id: number;
  username: string;
  email: string;
  /** Random text mixed into the password before hashing (hex). */
  salt: string;
  /** PBKDF2-SHA256 hash of salt + password (hex). */
  passwordHash: string;
  /** How many PBKDF2 rounds were used (saved so it can be raised later). */
  iterations: number;
  /** Which hasher made it: the phone's built-in one, or JavaScript. */
  engine?: 'native' | 'js';
  /** When the account was made (ISO date). */
  createdAt: string;
}

/**
 * The safe part of an account that screens may see (no salt, no hash).
 * (Called Account, not User: models/User.ts is the Friends user.)
 */
export interface Account {
  id: number;
  username: string;
  email: string;
}

/** What register() and logIn() give back. */
export type AuthResult =
  | { ok: true; user: Account }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** Keys used in storage. */
const ACCOUNTS_KEY = 'accounts';
const SESSION_KEY = 'session';

/**
 * PBKDF2 rounds. More rounds = harder to guess passwords, but slower.
 *
 *  - NATIVE_PBKDF2_ITERATIONS: with the phone's built-in hasher (fast).
 *  - PBKDF2_ITERATIONS: the JavaScript fallback. The phone's JavaScript
 *    engine (Hermes) has no "JIT" speed-up, so hashing in JavaScript is
 *    slow there; 2,000 rounds keeps it to about a second.
 *
 * Each account remembers its own number of rounds, so older accounts still
 * log in after these numbers change.
 */
export const NATIVE_PBKDF2_ITERATIONS = 50000;
export const PBKDF2_ITERATIONS = 2000;

/** Wrong passwords allowed in a row before a short wait. */
export const MAX_FAILED_ATTEMPTS = 5;

/** How long the wait is (milliseconds). */
export const LOCK_TIME_MS = 30 * 1000;

/** The one message for every failed log-in (see top of file). */
export const WRONG_LOGIN_MESSAGE = 'Wrong username or password.';

// ---------------------------------------------------------------------------
// Checking what the grown-up typed
// Each function returns an easy-English error, or null when it is fine.
// ---------------------------------------------------------------------------

/** 3-20 letters, numbers or _ (no spaces, so it is easy to type again). */
export function validateUsername(username: string): string | null {
  const name = username.trim();
  if (name.length < 3) {
    return 'The username needs at least 3 letters.';
  }
  if (name.length > 20) {
    return 'The username can have at most 20 letters.';
  }
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    return 'Use only letters, numbers and _ in the username.';
  }
  return null;
}

/** A simple "something@something.something" check. */
export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Please type a real email, like name@mail.com.';
  }
  return null;
}

/** At least 8 characters, with at least one letter and one number. */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'The password needs at least 8 characters.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'The password needs letters AND numbers.';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Small security helpers (exported so the tests can check them)
// ---------------------------------------------------------------------------

/**
 * Makes a new random salt (16 bytes, as hex).
 * A salt does not have to be secret - it only has to be different for every
 * account. We use the phone's secure random numbers when they exist, and
 * fall back to Math.random otherwise (still unique, which is what matters).
 */
export function makeSalt(): string {
  const bytes = new Uint8Array(16);
  const cryptoApi = (
    globalThis as {
      crypto?: { getRandomValues?: (array: Uint8Array) => Uint8Array };
    }
  ).crypto;
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytesToHex(bytes);
}

/** The phone's built-in hasher (android/.../PasswordHasherModule.kt). */
interface NativePasswordHasher {
  pbkdf2Sha256(password: string, salt: string, iterations: number, keyLength: number): Promise<string>;
}

function nativeHasher(): NativePasswordHasher | null {
  const module = (NativeModules as Record<string, unknown> | undefined)?.PasswordHasher as
    | NativePasswordHasher
    | undefined;
  return module && typeof module.pbkdf2Sha256 === 'function' ? module : null;
}

/** True when the fast built-in hasher can be used on this phone. */
export function hasNativeHasher(): boolean {
  return nativeHasher() !== null;
}

/** For developers: shows in the Metro window how long hashing took. */
function logTime(engine: string, iterations: number, started: number) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[log-in] password hashed in ${Date.now() - started} ms (${engine}, ${iterations} rounds)`);
  }
}

/** PBKDF2-SHA256 with the phone's built-in hasher, or null if it can't. */
async function nativeHash(password: string, salt: string, iterations: number): Promise<string | null> {
  const hasher = nativeHasher();
  if (!hasher) {
    return null;
  }
  const started = Date.now();
  try {
    const hex = await hasher.pbkdf2Sha256(password, salt, iterations, 32);
    if (/^[0-9a-f]{64}$/.test(hex)) {
      logTime('built-in', iterations, started);
      return hex;
    }
  } catch {
    // e.g. Android older than 8: use JavaScript instead
  }
  return null;
}

/**
 * PBKDF2-SHA256 in JavaScript. `pbkdf2Async` gives the screen a chance to
 * redraw while it works, so the app does not freeze.
 */
export async function hashPasswordJs(password: string, salt: string, iterations: number): Promise<string> {
  const started = Date.now();
  const hash = await pbkdf2Async(sha256, utf8ToBytes(password), utf8ToBytes(salt), {
    c: iterations,
    dkLen: 32,
  });
  logTime('JavaScript', iterations, started);
  return bytesToHex(hash);
}

/**
 * Hashes a password with PBKDF2-SHA256: with the phone's built-in hasher
 * when it can (fast), otherwise in JavaScript. Same result either way.
 */
export async function hashPassword(
  password: string,
  salt: string,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<string> {
  return (await nativeHash(password, salt, iterations)) ?? hashPasswordJs(password, salt, iterations);
}

/**
 * Hashes the password of a NEW account: many rounds with the built-in
 * hasher, or fewer rounds in JavaScript (so it never takes long).
 */
async function hashNewPassword(
  password: string,
  salt: string,
): Promise<{ passwordHash: string; iterations: number; engine: 'native' | 'js' }> {
  const fast = await nativeHash(password, salt, NATIVE_PBKDF2_ITERATIONS);
  if (fast) {
    return { passwordHash: fast, iterations: NATIVE_PBKDF2_ITERATIONS, engine: 'native' };
  }
  return {
    passwordHash: await hashPasswordJs(password, salt, PBKDF2_ITERATIONS),
    iterations: PBKDF2_ITERATIONS,
    engine: 'js',
  };
}

/**
 * Compares two strings in "constant time": it always looks at every
 * character, so how long it takes does not tell how much was right.
 */
export function safeEqual(a: string, b: string): boolean {
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return difference === 0;
}

/** Removes the secret fields before an account is handed to a screen. */
function toUser(account: StoredAccount): Account {
  return { id: account.id, username: account.username, email: account.email };
}

// ---------------------------------------------------------------------------
// The service
// ---------------------------------------------------------------------------

export class AuthService {
  /** Wrong-password counters, per lower-case username (kept in memory). */
  private failedAttempts = new Map<
    string,
    { count: number; lockedUntil: number }
  >();

  /**
   * @param store Where accounts are saved (the device by default).
   * @param now   Clock function (the tests pass a fake clock).
   */
  constructor(
    private readonly store: KeyValueStore = deviceStorage,
    private readonly now: () => number = Date.now,
  ) {}

  /** All saved accounts. */
  private async loadAccounts(): Promise<StoredAccount[]> {
    const accounts = await readJson<StoredAccount[]>(
      this.store,
      ACCOUNTS_KEY,
      [],
    );
    return Array.isArray(accounts) ? accounts : [];
  }

  /**
   * register(): makes a new account and logs it in.
   * Fails (with an easy-English message) when a field is not OK or the
   * username / email is already used.
   */
  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<AuthResult> {
    const cleanName = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const problem =
      validateUsername(cleanName) ??
      validateEmail(cleanEmail) ??
      validatePassword(password);
    if (problem) {
      return { ok: false, error: problem };
    }

    const accounts = await this.loadAccounts();
    const nameTaken = accounts.some(
      a => a.username.toLowerCase() === cleanName.toLowerCase(),
    );
    if (nameTaken) {
      return {
        ok: false,
        error: 'This username is taken. Please pick another one.',
      };
    }
    if (accounts.some(a => a.email === cleanEmail)) {
      return {
        ok: false,
        error: 'This email already has an account. Please log in.',
      };
    }

    const salt = makeSalt();
    const account: StoredAccount = {
      // Ids count up from 1: 1, 2, 3 ...
      id: accounts.reduce((max, a) => Math.max(max, a.id), 0) + 1,
      username: cleanName,
      email: cleanEmail,
      salt,
      ...(await hashNewPassword(password, salt)),
      createdAt: new Date(this.now()).toISOString(),
    };

    await writeJson(this.store, ACCOUNTS_KEY, [...accounts, account]);
    await writeJson(this.store, SESSION_KEY, { userId: account.id });
    return { ok: true, user: toUser(account) };
  }

  /**
   * logIn(): checks the username and password.
   * On success the user stays logged in until logOut() (even after the app
   * is closed), so the child does not have to type anything next time.
   */
  async logIn(username: string, password: string): Promise<AuthResult> {
    const result = await this.checkPassword(username, password);
    if (result.ok) {
      await writeJson(this.store, SESSION_KEY, { userId: result.user.id });
    }
    return result;
  }

  /**
   * checkPassword(): the same check as logIn(), but it does not log anyone
   * in. Used when a grown-up must prove it is them (e.g. turning on Friends).
   * Wrong tries count towards the same 30-second wait.
   */
  async checkPassword(username: string, password: string): Promise<AuthResult> {
    const key = username.trim().toLowerCase();

    // Nothing typed yet? Say so (this gives no hints to a guesser).
    if (key.length === 0 || password.length === 0) {
      return { ok: false, error: 'Please type your username and password.' };
    }

    // Too many wrong tries? Ask to wait.
    const record = this.failedAttempts.get(key);
    if (record && record.lockedUntil > this.now()) {
      const seconds = Math.ceil((record.lockedUntil - this.now()) / 1000);
      return {
        ok: false,
        error: `Too many tries. Please wait ${seconds} seconds and try again.`,
      };
    }

    const accounts = await this.loadAccounts();
    const account = accounts.find(a => a.username.toLowerCase() === key);

    // We hash even when the username does not exist, so a wrong username
    // takes as long as a wrong password (no hints for guessers).
    let hash = await hashPassword(
      password,
      account ? account.salt : 'no-such-user',
      account ? account.iterations : hasNativeHasher() ? NATIVE_PBKDF2_ITERATIONS : PBKDF2_ITERATIONS,
    );

    // Extra safety for accounts made by the JavaScript hasher: if the
    // built-in one ever disagreed, check once more with JavaScript.
    if (account && !safeEqual(hash, account.passwordHash) && account.engine !== 'native' && hasNativeHasher()) {
      hash = await hashPasswordJs(password, account.salt, account.iterations);
    }

    if (!account || !safeEqual(hash, account.passwordHash)) {
      this.recordFailure(key);
      return { ok: false, error: WRONG_LOGIN_MESSAGE };
    }

    this.failedAttempts.delete(key);
    return { ok: true, user: toUser(account) };
  }

  /** Counts a wrong try; after MAX_FAILED_ATTEMPTS, locks for LOCK_TIME_MS. */
  private recordFailure(key: string): void {
    const count = (this.failedAttempts.get(key)?.count ?? 0) + 1;
    const lock = count >= MAX_FAILED_ATTEMPTS;
    // After a lock, the counter starts again from 0.
    this.failedAttempts.set(key, {
      count: lock ? 0 : count,
      lockedUntil: lock ? this.now() + LOCK_TIME_MS : 0,
    });
  }

  /** logOut(): forgets who is logged in (the account itself stays). */
  async logOut(): Promise<void> {
    await this.store.removeItem(SESSION_KEY);
  }

  /** The logged-in user, or null. Used when the app starts. */
  async getCurrentUser(): Promise<Account | null> {
    const session = await readJson<{ userId?: number } | null>(
      this.store,
      SESSION_KEY,
      null,
    );
    if (!session || typeof session.userId !== 'number') {
      return null;
    }
    const accounts = await this.loadAccounts();
    const account = accounts.find(a => a.id === session.userId);
    return account ? toUser(account) : null;
  }
}

/** The one AuthService the app uses (saves to the device). */
export const authService = new AuthService();
