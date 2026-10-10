/**
 * rewardsService.ts
 * --------------------------------------------------------------------------
 * Saves each child's space candies, shop items, tests and weekly homework
 * ON THE DEVICE (one entry per child account). The rules themselves are in
 * models/Rewards.ts.
 */
import { normalizeRewards, type RewardsState } from '../models/Rewards';
import { deviceStorage, type KeyValueStore, readJson, writeJson } from './storage';

const key = (localUserId: number) => `rewards.${localUserId}`;

export class RewardsService {
  constructor(private readonly store: KeyValueStore = deviceStorage) {}

  async load(localUserId: number): Promise<RewardsState> {
    return normalizeRewards(await readJson<Partial<RewardsState> | null>(this.store, key(localUserId), null));
  }

  async save(localUserId: number, state: RewardsState): Promise<void> {
    await writeJson(this.store, key(localUserId), state);
  }
}

export const rewardsService = new RewardsService();
