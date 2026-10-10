/**
 * content.js
 * --------------------------------------------------------------------------
 * Reads the app's content files (src/data/phrases.json, feelings.json,
 * looks.json, buddy.json) so the server and the app always agree on:
 *   - which ready-made phrases exist (only these can be sent as phrases)
 *   - which feelings exist
 *   - which avatar / buddy parts exist (anything else is refused)
 *   - which kinds of space buddy "worry alerts" exist (buddy.json "safety")
 */
import fs from 'node:fs';
import path from 'node:path';

import { checkName } from './filter.js';

export class Content {
  constructor(contentDir) {
    const read = name => JSON.parse(fs.readFileSync(path.join(contentDir, name), 'utf8'));
    const phrases = read('phrases.json');
    const feelings = read('feelings.json');
    this.looks = read('looks.json');
    const buddy = read('buddy.json');
    /** worry kind id -> what the grown-ups see ("Someone is hurting them") */
    this.alertKinds = new Map(buddy.safety.map(s => [s.id, s.title]));

    /** phrase id -> phrase text */
    this.phrases = new Map();
    for (const category of phrases.categories) {
      for (const phrase of category.phrases) {
        this.phrases.set(phrase.id, phrase.text);
      }
    }
    /** feeling id -> { name, emoji } */
    this.feelings = new Map(feelings.feelings.map(f => [f.id, f]));
  }

  alertTitle(category) {
    return this.alertKinds.get(category);
  }

  phraseText(id) {
    return this.phrases.get(id);
  }

  feeling(id) {
    return this.feelings.get(id);
  }

  /**
   * Checks an avatar look sent by the app. Returns a clean copy, or null when
   * something is not in looks.json.
   */
  cleanHumanLook(look) {
    const h = this.looks.human;
    const has = (list, id) => list.some(item => item.id === id);
    if (!look || typeof look !== 'object') {
      return null;
    }
    const accessories = Array.isArray(look.accessories) ? look.accessories : [];
    if (
      !has(h.hair, look.hair) ||
      !has(h.hairColor, look.hairColor) ||
      !has(h.skin, look.skin) ||
      !has(h.outfit, look.outfit) ||
      !accessories.every(a => has(h.accessories, a))
    ) {
      return null;
    }
    return {
      isHuman: true,
      hair: look.hair,
      hairColor: look.hairColor,
      skin: look.skin,
      outfit: look.outfit,
      accessories: [...new Set(accessories)],
    };
  }

  /** Checks a space buddy sent by the app (kind, name, style, colour, extras). */
  cleanPet(pet) {
    const p = this.looks.pet;
    const has = (list, id) => (list ?? []).some(item => item.id === id);
    if (!pet || typeof pet !== 'object') {
      return null;
    }
    const accessories = Array.isArray(pet.accessories) ? pet.accessories : [];
    const name = String(pet.name ?? '').trim();
    // The buddy's face. Older apps send none: use the default.
    const mood = pet.mood ?? this.looks.defaults?.pet?.mood ?? 'happy';
    if (
      !has(p.moods, mood) ||
      !has(p.kinds, pet.kind) ||
      !has(p.styles[pet.kind], pet.style) ||
      !has(p.colors, pet.color) ||
      !accessories.every(a => has(p.accessories, a)) ||
      !checkName(name).ok
    ) {
      return null;
    }
    return {
      kind: pet.kind,
      name,
      style: pet.style,
      color: pet.color,
      mood,
      accessories: [...new Set(accessories)],
    };
  }
}
