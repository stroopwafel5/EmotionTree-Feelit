/**
 * looksCatalog.ts
 * --------------------------------------------------------------------------
 * Reads src/data/looks.json and turns every item into a Dec.
 * The dress-up screens show these lists; Look.defineLook() checks choices
 * against them.
 */
import looksData from '../data/looks.json';
import { Dec, type DecJson, type DecKind } from '../models/Dec';

const toDecs = (kind: DecKind, list: DecJson[]) =>
  list.map(item => Dec.fromJson(kind, item));

/** Everything a child can choose, as Decs. */
export const catalog = {
  human: {
    hair: toDecs('hair', looksData.human.hair),
    hairColor: toDecs('hairColor', looksData.human.hairColor),
    skin: toDecs('skin', looksData.human.skin),
    outfit: toDecs('outfit', looksData.human.outfit),
    accessories: toDecs('accessory', looksData.human.accessories),
  },
  pet: {
    kinds: toDecs('petKind', looksData.pet.kinds),
    styles: {
      cat: toDecs('petStyle', looksData.pet.styles.cat),
      dog: toDecs('petStyle', looksData.pet.styles.dog),
      alien: toDecs('petStyle', looksData.pet.styles.alien),
    } as Record<string, Dec[]>,
    colors: toDecs('petColor', looksData.pet.colors),
    /** The buddy's face (smile, frown, silly...). "mirror" copies the child's feeling. */
    moods: toDecs('petMood', looksData.pet.moods),
    accessories: toDecs('petAccessory', looksData.pet.accessories),
  },
  defaults: looksData.defaults,
};

/** Finds a Dec by id in a list, or throws a clear error. */
export function findDec(list: Dec[], id: string, what: string): Dec {
  const dec = list.find(item => item.id === id);
  if (!dec) {
    throw new Error(`Unknown ${what}: "${id}". Check src/data/looks.json.`);
  }
  return dec;
}
