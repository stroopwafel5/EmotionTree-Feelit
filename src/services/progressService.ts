/**
 * progressService.ts
 * --------------------------------------------------------------------------
 * Remembers which leaves each child has finished, so the rainbow tree looks
 * the same the next time the app is opened.
 *
 * What is saved: just the list of finished level ids, per user.
 *   key "progress.1"  ->  "[1,2]"   (user 1 finished Happiness and Sadness)
 *
 * MainScreen reads this list when it builds the Levels, and saves it again
 * every time a level is finished.
 */
import {
  deviceStorage,
  type KeyValueStore,
  readJson,
  writeJson,
} from './storage';

/** The storage key for one user's progress. */
function progressKey(userId: number): string {
  return `progress.${userId}`;
}

export class ProgressService {
  /** @param store Where progress is saved (the device by default). */
  constructor(private readonly store: KeyValueStore = deviceStorage) {}

  /** The ids of the levels this user has finished (empty for a new user). */
  async loadCompletedLevelIds(userId: number): Promise<number[]> {
    const ids = await readJson<unknown>(this.store, progressKey(userId), []);
    // Only keep real numbers, in case the saved data was damaged.
    return Array.isArray(ids)
      ? ids.filter((id): id is number => typeof id === 'number')
      : [];
  }

  /** Saves the ids of the levels this user has finished. */
  async saveCompletedLevelIds(userId: number, ids: number[]): Promise<void> {
    await writeJson(this.store, progressKey(userId), ids);
  }

  /** Starts this user's tree again from the beginning. */
  async reset(userId: number): Promise<void> {
    await this.store.removeItem(progressKey(userId));
  }
}

/** The one ProgressService the app uses (saves to the device). */
export const progressService = new ProgressService();
