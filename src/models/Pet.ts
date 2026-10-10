/**
 * Pet.ts
 * --------------------------------------------------------------------------
 * The child's space buddy: a cat, a dog or a green alien, with a name and a
 * Look (isHuman = false). The child designs it in the Buddy Studio.
 *
 * Brief: User (..., Pet pet)
 */
import { catalog } from '../services/looksCatalog';
import { Look, type PetChoices } from './Look';

/** A buddy as it is saved and sent to the server. */
export interface PetJson extends PetChoices {
  name: string;
}

export class Pet {
  /**
   * @param id     Buddy number (the owner's user id: one buddy per child).
   * @param userId The owner.
   * @param name   The buddy's name, e.g. "Comet".
   * @param look   How the buddy looks (kind, style, colour, accessories).
   */
  constructor(
    public id: number,
    public userId: number,
    public name: string,
    public look: Look,
  ) {}

  /** "cat", "dog" or "alien". */
  getKind(): string {
    return this.look.kind?.id ?? 'alien';
  }

  /** The buddy's face: "happy", "sad", "silly"... or "mirror" (copies the owner's feeling). */
  getMood(): string {
    return this.look.mood?.id ?? 'happy';
  }

  /**
   * Gives the buddy a new name. Names are 1-16 letters, numbers or spaces.
   * Friends can see the name, so it can't hide a phone number or a link
   * (the server checks again).
   * Returns an easy-English problem, or null when the name is OK.
   */
  rename(name: string): string | null {
    const clean = name.trim();
    if (!/^[\p{L}\p{N} .'-]{1,16}$/u.test(clean)) {
      return 'Names can have 1-16 letters, numbers and spaces.';
    }
    if ((clean.match(/\p{N}/gu) ?? []).length > 4 || /\.\p{L}{2,}/u.test(clean)) {
      return 'Please pick a name without phone numbers or links.';
    }
    this.name = clean;
    return null;
  }

  toJson(): PetJson {
    return { name: this.name, ...(this.look.toChoices() as PetChoices) };
  }

  /** Builds a buddy from saved data (unknown parts fall back to defaults). */
  static fromJson(userId: number, json: Partial<PetJson> | null): Pet {
    const look = Look.safePet(userId, json);
    return new Pet(userId, userId, json?.name || catalog.defaults.pet.name, look);
  }
}
