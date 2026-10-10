/**
 * storage.ts
 * --------------------------------------------------------------------------
 * The ONE place where the app saves things on the device.
 *
 * The brief says: "All logged in accounts should be kept within the computer
 * for now." So nothing is sent to a server. Everything is saved in the phone
 * (or the Android Studio emulator) using AsyncStorage.
 *
 * What is saved here:
 *  - the list of accounts (username, email, and a HASH of the password -
 *    never the password itself, see authService.ts)
 *  - who is logged in right now
 *  - which leaves each child has finished (see progressService.ts)
 *
 * Why an interface?
 *  The other services do not talk to AsyncStorage directly. They talk to a
 *  `KeyValueStore`. In the app that is AsyncStorage; in the tests it is a
 *  simple in-memory store. That makes the services easy to test, and easy to
 *  move to a real server later (just write another KeyValueStore).
 */
import { createAsyncStorage } from '@react-native-async-storage/async-storage';

/** The few storage functions the app needs. All of them are async. */
export interface KeyValueStore {
  /** Returns the saved text for `key`, or null if nothing is saved. */
  getItem(key: string): Promise<string | null>;
  /** Saves `value` under `key` (replaces what was there). */
  setItem(key: string, value: string): Promise<void>;
  /** Deletes `key`. */
  removeItem(key: string): Promise<void>;
}

/**
 * The app's own storage on the device.
 * AsyncStorage v3 gives each app part its own named database; ours is
 * called "emotion-tree".
 */
export const deviceStorage: KeyValueStore = createAsyncStorage('emotion-tree');

/**
 * A store that only lives in memory (it is empty again after a restart).
 * Used by the tests, and handy for trying things out.
 */
export class MemoryStore implements KeyValueStore {
  private data = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.data.delete(key);
  }
}

/**
 * Reads a saved JSON value. Returns `fallback` when nothing is saved yet or
 * when the saved text is broken (so a bad save can never crash the app).
 */
export async function readJson<T>(
  store: KeyValueStore,
  key: string,
  fallback: T,
): Promise<T> {
  const text = await store.getItem(key);
  if (text === null) {
    return fallback;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/** Saves any value as JSON text. */
export async function writeJson(
  store: KeyValueStore,
  key: string,
  value: unknown,
): Promise<void> {
  await store.setItem(key, JSON.stringify(value));
}
