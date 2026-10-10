/**
 * Dec.ts
 * --------------------------------------------------------------------------
 * A "Dec" (short for decoration) is ONE thing a child can choose for a look:
 * a hair style, a hair colour, a skin colour, an outfit, an accessory like
 * cat ears or glasses - or, for a space buddy, its kind, style, colour or
 * accessory.
 *
 * All Decs come from src/data/looks.json (see services/looksCatalog.ts).
 * A Dec with a price is a SHOP item: the child buys it with space candies
 * (guitar, fire powers, pumpkin costume...). Without a price it is free.
 *
 * Brief:  Look (..., Dec hair, Dec skin, Dec[] accessories)
 */

/** Which part of a look a Dec is for. */
export type DecKind =
  | 'hair'
  | 'hairColor'
  | 'skin'
  | 'outfit'
  | 'accessory'
  | 'petKind'
  | 'petStyle'
  | 'petColor'
  | 'petMood'
  | 'petAccessory';

/** The shape of one item in looks.json. */
export interface DecJson {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  /** Space candies it costs in the shop (no price = free). */
  price?: number;
}

export class Dec {
  /**
   * @param id    Short id used in saved data, e.g. "catEars".
   * @param kind  Which part of the look it is for.
   * @param name  Name shown to the child, e.g. "Cat ears".
   * @param icon  Emoji on the picker button (for styles and accessories).
   * @param color Colour code (for hair / skin / outfit / buddy colours).
   * @param price Space candies it costs in the shop (0 = free).
   */
  constructor(
    public readonly id: string,
    public readonly kind: DecKind,
    public readonly name: string,
    public readonly icon: string = '',
    public readonly color: string = '',
    public readonly price: number = 0,
  ) {}

  static fromJson(kind: DecKind, json: DecJson): Dec {
    return new Dec(json.id, kind, json.name, json.icon ?? '', json.color ?? '', json.price ?? 0);
  }

  /** True for things the child buys in the Space Shop. */
  isShopItem(): boolean {
    return this.price > 0;
  }

  /** True for colour choices (they show a colour dot instead of an emoji). */
  isColor(): boolean {
    return this.color !== '';
  }
}
