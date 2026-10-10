/**
 * profileService.ts
 * --------------------------------------------------------------------------
 * Saves the child's avatar, space buddy and current feeling ON THE DEVICE,
 * so they work even without Friends. When Friends is on, MainScreen also
 * sends them to the server so friends can see them.
 */
import type { HumanChoices } from '../models/Look';
import type { PetJson } from '../models/Pet';
import { catalog } from './looksCatalog';
import { deviceStorage, type KeyValueStore, readJson, writeJson } from './storage';

export interface SavedProfile {
  look: HumanChoices;
  pet: PetJson;
  feeling: string | null;
}

const key = (localUserId: number) => `profile.${localUserId}`;

export class ProfileService {
  constructor(private readonly store: KeyValueStore = deviceStorage) {}

  /** The default avatar and buddy from looks.json, and no feeling. */
  static defaults(): SavedProfile {
    return { look: { ...catalog.defaults.human }, pet: { ...catalog.defaults.pet }, feeling: null };
  }

  /** The saved profile, or the defaults from looks.json for a new child. */
  async load(localUserId: number): Promise<SavedProfile> {
    const saved = await readJson<Partial<SavedProfile> | null>(this.store, key(localUserId), null);
    return {
      look: { ...catalog.defaults.human, ...(saved?.look ?? {}) },
      pet: { ...catalog.defaults.pet, ...(saved?.pet ?? {}) },
      feeling: saved?.feeling ?? null,
    };
  }

  async save(localUserId: number, profile: SavedProfile): Promise<void> {
    await writeJson(this.store, key(localUserId), profile);
  }
}

export const profileService = new ProfileService();
