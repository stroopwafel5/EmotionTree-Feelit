/**
 * auth.test.ts
 * --------------------------------------------------------------------------
 * Checks the log-in system (authService) and saved progress
 * (progressService). Uses an in-memory store instead of the phone.
 */
import { NativeModules } from 'react-native';

import {
  AuthService,
  hashPassword,
  hashPasswordJs,
  LOCK_TIME_MS,
  MAX_FAILED_ATTEMPTS,
  NATIVE_PBKDF2_ITERATIONS,
  PBKDF2_ITERATIONS,
  safeEqual,
  validateEmail,
  validatePassword,
  validateUsername,
  WRONG_LOGIN_MESSAGE,
} from '../src/services/authService';
import { ProgressService } from '../src/services/progressService';
import { MemoryStore } from '../src/services/storage';

/** A fake clock the tests can move forward. */
function fakeClock(start = 1_000_000) {
  let time = start;
  return {
    now: () => time,
    advance: (ms: number) => {
      time += ms;
    },
  };
}

describe('checking what is typed', () => {
  it('checks usernames', () => {
    expect(validateUsername('star_kid')).toBeNull();
    expect(validateUsername('ab')).not.toBeNull();
    expect(validateUsername('has space')).not.toBeNull();
  });

  it('checks emails', () => {
    expect(validateEmail('mom@mail.com')).toBeNull();
    expect(validateEmail('not-an-email')).not.toBeNull();
  });

  it('checks passwords', () => {
    expect(validatePassword('rocket123')).toBeNull();
    expect(validatePassword('short1')).not.toBeNull();
    expect(validatePassword('onlyletters')).not.toBeNull();
  });
});

describe('password hashing', () => {
  it('gives the same hash for the same password and salt', async () => {
    const a = await hashPassword('rocket123', 'salt', 1000);
    const b = await hashPassword('rocket123', 'salt', 1000);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('gives a different hash for a different password or salt', async () => {
    const a = await hashPassword('rocket123', 'salt', 1000);
    expect(await hashPassword('rocket124', 'salt', 1000)).not.toBe(a);
    expect(await hashPassword('rocket123', 'pepper', 1000)).not.toBe(a);
  });

  it('matches the official PBKDF2-SHA256 test vector', async () => {
    // RFC 7914, section 11: P="passwd", S="salt", c=1, dkLen=64.
    // We use dkLen=32, so we compare with the first 32 bytes.
    expect(await hashPassword('passwd', 'salt', 1)).toBe(
      '55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc',
    );
  });

  it('safeEqual compares strings correctly', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('AuthService', () => {
  it('registers, logs out, and logs in again', async () => {
    const store = new MemoryStore();
    const auth = new AuthService(store);

    const made = await auth.register('Star_Kid', 'Mom@Mail.com', 'rocket123');
    expect(made.ok).toBe(true);
    expect(await auth.getCurrentUser()).toEqual({
      id: 1,
      username: 'Star_Kid',
      email: 'mom@mail.com',
    });

    await auth.logOut();
    expect(await auth.getCurrentUser()).toBeNull();

    // Usernames are not case-sensitive when logging in.
    const back = await auth.logIn('star_kid', 'rocket123');
    expect(back.ok).toBe(true);
  });

  it('never saves the password itself', async () => {
    const store = new MemoryStore();
    await new AuthService(store).register('luna', 'l@mail.com', 'moon2024ok');
    const saved = (await store.getItem('accounts')) ?? '';
    expect(saved).not.toContain('moon2024ok');
    expect(saved).toContain('passwordHash');
  });

  it('refuses a wrong password with a general message', async () => {
    const auth = new AuthService(new MemoryStore());
    await auth.register('luna', 'l@mail.com', 'moon2024ok');
    const result = await auth.logIn('luna', 'wrong1234');
    expect(result).toEqual({ ok: false, error: WRONG_LOGIN_MESSAGE });
    // An unknown username gets the SAME message.
    expect(await auth.logIn('nobody', 'moon2024ok')).toEqual(result);
  });

  it('refuses a username or email that is already used', async () => {
    const auth = new AuthService(new MemoryStore());
    await auth.register('luna', 'l@mail.com', 'moon2024ok');
    expect((await auth.register('LUNA', 'x@mail.com', 'moon2024ok')).ok).toBe(
      false,
    );
    expect((await auth.register('sol', 'L@mail.com', 'moon2024ok')).ok).toBe(
      false,
    );
  });

  it('makes you wait after too many wrong passwords', async () => {
    const clock = fakeClock();
    const auth = new AuthService(new MemoryStore(), clock.now);
    await auth.register('luna', 'l@mail.com', 'moon2024ok');

    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      await auth.logIn('luna', 'wrong1234');
    }
    // Locked: even the right password has to wait.
    const locked = await auth.logIn('luna', 'moon2024ok');
    expect(locked.ok).toBe(false);
    expect(!locked.ok && locked.error).toContain('wait');

    clock.advance(LOCK_TIME_MS + 1);
    expect((await auth.logIn('luna', 'moon2024ok')).ok).toBe(true);
  });
});

describe('ProgressService', () => {
  it('saves and loads finished levels per user', async () => {
    const progress = new ProgressService(new MemoryStore());
    expect(await progress.loadCompletedLevelIds(1)).toEqual([]);

    await progress.saveCompletedLevelIds(1, [1, 2]);
    expect(await progress.loadCompletedLevelIds(1)).toEqual([1, 2]);
    expect(await progress.loadCompletedLevelIds(2)).toEqual([]); // other child

    await progress.reset(1);
    expect(await progress.loadCompletedLevelIds(1)).toEqual([]);
  });
});

describe("The phone's built-in (fast) password hasher", () => {
  // Stand-in for android/.../PasswordHasherModule.kt. On a phone it is real
  // Android code; here it does the same maths, so we can check the rules.
  const fakeNative = (fail = false) => ({
    pbkdf2Sha256: async (password: string, salt: string, rounds: number) => {
      if (fail) {
        throw new Error('PBKDF2WithHmacSHA256 not available');
      }
      return hashPasswordJs(password, salt, rounds);
    },
  });
  const modules = NativeModules as Record<string, unknown>;
  afterEach(() => {
    delete modules.PasswordHasher;
  });

  it('new accounts use many more rounds when the built-in hasher is there', async () => {
    modules.PasswordHasher = fakeNative();
    const store = new MemoryStore();
    await new AuthService(store).register('nova', 'n@mail.com', 'galaxy2024');
    const [saved] = JSON.parse((await store.getItem('accounts')) ?? '[]');
    expect(saved.engine).toBe('native');
    expect(saved.iterations).toBe(NATIVE_PBKDF2_ITERATIONS);
    expect((await new AuthService(store).logIn('nova', 'galaxy2024')).ok).toBe(true);
    expect((await new AuthService(store).logIn('nova', 'galaxy2025')).ok).toBe(false);
  });

  it('falls back to JavaScript (fewer rounds) when the built-in hasher fails', async () => {
    modules.PasswordHasher = fakeNative(true);
    const store = new MemoryStore();
    await new AuthService(store).register('luna', 'l@mail.com', 'moon2024ok');
    const [saved] = JSON.parse((await store.getItem('accounts')) ?? '[]');
    expect(saved.engine).toBe('js');
    expect(saved.iterations).toBe(PBKDF2_ITERATIONS);
    expect((await new AuthService(store).logIn('luna', 'moon2024ok')).ok).toBe(true);
  });

  it('older accounts (made in JavaScript) still log in with the built-in hasher', async () => {
    const store = new MemoryStore();
    await new AuthService(store).register('star', 's@mail.com', 'rocket1234');
    modules.PasswordHasher = fakeNative();
    expect((await new AuthService(store).logIn('star', 'rocket1234')).ok).toBe(true);
    expect((await new AuthService(store).logIn('star', 'rocket9999')).ok).toBe(false);
  });
});
