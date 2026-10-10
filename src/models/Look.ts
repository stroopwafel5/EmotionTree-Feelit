/**
 * Look.ts
 * --------------------------------------------------------------------------
 * How an avatar looks: the child's own avatar (a kid) OR a space buddy
 * (a cat, a dog or a green alien).
 *
 * Brief:  Look (int id, int userID, boolean isHuman, Dec hair, Dec skin, Dec[] accessories)
 *         with a defineLook function for Humans and for Pets.
 *
 * What the fields mean:
 *
 *            | Human (isHuman = true)        | Pet (isHuman = false)
 *  ----------+-------------------------------+-----------------------------------
 *  hair      | hair style ("buns", "curly")  | the buddy's style ("stripes",
 *            |                               |  "floppy" ears, "threeEyes")
 *  skin      | skin colour                   | fur / body colour ("Alien green")
 *  accessories| cat ears, glasses, bow...    | space helmet, scarf, bow tie...
 *
 * (A child's FACE follows the feeling they share - see User.feeling.
 *  A buddy has its own face: its "mood".)
 *
 * Added on top of the brief (optional):
 *  - hairColor : the hair colour (humans)
 *  - outfit    : the T-shirt colour or space suit (humans)
 *  - kind      : cat / dog / alien (pets)
 *  - mood      : the buddy's face - smile, big grin, silly, frown...
 *                ("mirror" = copies the child's own feeling) (pets)
 */
import { catalog, findDec } from '../services/looksCatalog';
import { Dec } from './Dec';

/** What a child picks for their own avatar (ids from looks.json). */
export interface HumanChoices {
  hair: string;
  hairColor: string;
  skin: string;
  outfit: string;
  accessories: string[];
}

/** What a child picks for their space buddy (ids from looks.json). */
export interface PetChoices {
  kind: string;
  style: string;
  color: string;
  /** The buddy's face (optional: older saves have none -> "happy"). */
  mood?: string;
  accessories: string[];
}

export class Look {
  /**
   * @param id          Look number.
   * @param userId      Whose look this is.
   * @param isHuman     true = the child's avatar, false = a space buddy.
   * @param hair        Hair style (human) or buddy style (pet).
   * @param skin        Skin colour (human) or fur / body colour (pet).
   * @param accessories Extras (cat ears, glasses / helmet, scarf...).
   * @param hairColor   Hair colour (humans, added).
   * @param outfit      Outfit colour (humans, added).
   * @param kind        Cat, dog or alien (pets, added).
   * @param mood        The buddy's face (pets, added).
   */
  constructor(
    public id: number,
    public userId: number,
    public isHuman: boolean,
    public hair: Dec,
    public skin: Dec,
    public accessories: Dec[],
    public hairColor: Dec | null = null,
    public outfit: Dec | null = null,
    public kind: Dec | null = null,
    public mood: Dec | null = null,
  ) {}

  /**
   * defineLook(): sets the whole look from the child's choices, for a
   * HUMAN or a PET. Every choice is checked against looks.json; unknown
   * choices throw an error (so a typo can never break the drawing).
   *
   *   avatar.defineLook({ hair: 'buns', hairColor: 'purple', skin: 'skin4',
   *                       outfit: 'spacesuit', accessories: ['catEars'] });
   *   buddy.defineLook({ kind: 'alien', style: 'threeEyes', color: 'green',
   *                      mood: 'silly', accessories: ['spaceHelmet'] });
   */
  defineLook(choices: HumanChoices | PetChoices): Look {
    if (this.isHuman) {
      const c = choices as HumanChoices;
      const h = catalog.human;
      this.hair = findDec(h.hair, c.hair, 'hair style');
      this.hairColor = findDec(h.hairColor, c.hairColor, 'hair colour');
      this.skin = findDec(h.skin, c.skin, 'skin colour');
      this.outfit = findDec(h.outfit, c.outfit, 'outfit');
      this.accessories = unique(c.accessories).map(a =>
        findDec(h.accessories, a, 'accessory'),
      );
      this.kind = null;
      this.mood = null;
    } else {
      const c = choices as PetChoices;
      const p = catalog.pet;
      this.kind = findDec(p.kinds, c.kind, 'buddy kind');
      this.hair = findDec(p.styles[c.kind] ?? [], c.style, 'buddy style');
      this.skin = findDec(p.colors, c.color, 'buddy colour');
      this.mood = findDec(p.moods, c.mood ?? catalog.defaults.pet.mood, 'buddy face');
      this.accessories = unique(c.accessories).map(a =>
        findDec(p.accessories, a, 'buddy accessory'),
      );
      this.hairColor = null;
      this.outfit = null;
    }
    return this;
  }

  /** True when the look has this accessory (e.g. "glasses"). */
  has(accessoryId: string): boolean {
    return this.accessories.some(a => a.id === accessoryId);
  }

  /** The choices again (to save, send to the server, or edit). */
  toChoices(): HumanChoices | PetChoices {
    if (this.isHuman) {
      return {
        hair: this.hair.id,
        hairColor: this.hairColor?.id ?? catalog.defaults.human.hairColor,
        skin: this.skin.id,
        outfit: this.outfit?.id ?? catalog.defaults.human.outfit,
        accessories: this.accessories.map(a => a.id),
      };
    }
    return {
      kind: this.kind?.id ?? catalog.defaults.pet.kind,
      style: this.hair.id,
      color: this.skin.id,
      mood: this.mood?.id ?? catalog.defaults.pet.mood,
      accessories: this.accessories.map(a => a.id),
    };
  }

  /** A new human look with the default choices from looks.json. */
  static defaultHuman(userId: number): Look {
    return Look.human(userId, catalog.defaults.human);
  }

  /** A new human look from choices. */
  static human(userId: number, choices: HumanChoices): Look {
    const blank = new Look(
      userId,
      userId,
      true,
      catalog.human.hair[0],
      catalog.human.skin[0],
      [],
    );
    return blank.defineLook(choices);
  }

  /** A new pet look from choices. */
  static pet(userId: number, choices: PetChoices): Look {
    const blank = new Look(
      userId,
      userId,
      false,
      catalog.pet.styles.alien[0],
      catalog.pet.colors[0],
      [],
    );
    return blank.defineLook(choices);
  }

  /**
   * Like human() / pet(), but never throws: unknown choices (for example
   * from an older app version) fall back to the defaults.
   */
  static safeHuman(userId: number, choices: Partial<HumanChoices> | null) {
    try {
      return Look.human(userId, { ...catalog.defaults.human, ...choices });
    } catch {
      return Look.defaultHuman(userId);
    }
  }

  static safePet(userId: number, choices: Partial<PetChoices> | null) {
    try {
      return Look.pet(userId, { ...catalog.defaults.pet, ...choices });
    } catch {
      return Look.pet(userId, catalog.defaults.pet);
    }
  }
}

function unique(list: string[] | undefined): string[] {
  return [...new Set(list ?? [])];
}
