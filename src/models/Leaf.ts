/**
 * Leaf.ts
 * --------------------------------------------------------------------------
 * A leaf is ONE level as the child sees it on the tree path.
 *
 * Brief:  Leaf (int id, string Name, boolean completed, boolean isNext)
 *
 * Added on top of the brief:
 *  - `icon`      : the emoji drawn on the leaf (optional, default 🍃).
 *  - `section`   : the planet (group of levels) this leaf is on, e.g.
 *                  "🪐 Planet 1: Basic Feelings" (optional). MyTree.draw()
 *                  shows a heading where a new planet starts.
 *  - `clickable` : the brief says "ONLY LEAVES WITH clickable = true should be
 *                  clickable". A leaf is clickable when it is already
 *                  completed (play it again) OR when it is the next leaf.
 *                  Locked leaves are never clickable.
 *
 * A Leaf is a small read-only "snapshot". It is made by `Level.toLeaf()`.
 * When something changes (a level is finished), MyTree swaps in a new Leaf
 * instead of editing the old one. That keeps the drawing simple and safe.
 */

/** The three ways a leaf can look on the tree. */
export type LeafStatus = 'completed' | 'next' | 'locked';

export class Leaf {
  /**
   * @param id        Same number as the level.
   * @param name      Level name, e.g. "Happiness".
   * @param completed True when the child finished this level.
   * @param isNext    True for the ONE leaf the child should play next.
   * @param icon      Emoji drawn on the leaf (added, optional).
   * @param section   Planet label (added, optional).
   */
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly completed: boolean,
    public readonly isNext: boolean,
    public readonly icon: string = '🍃',
    public readonly section: string = '',
  ) {}

  /** Only completed leaves and the next leaf can be tapped. */
  get clickable(): boolean {
    return this.completed || this.isNext;
  }

  /**
   * Which of the three looks this leaf gets:
   *  - completed -> light purple
   *  - next      -> dark purple
   *  - locked    -> grey
   */
  getStatus(): LeafStatus {
    if (this.completed) {
      return 'completed';
    }
    if (this.isNext) {
      return 'next';
    }
    return 'locked';
  }

  /** Returns a copy of this leaf with a different `isNext` value. */
  withIsNext(isNext: boolean): Leaf {
    return new Leaf(
      this.id,
      this.name,
      this.completed,
      isNext,
      this.icon,
      this.section,
    );
  }

  /** Readable text form, used by MyTree.getTree() and for debugging. */
  toString(): string {
    return (
      `Leaf(${this.id}, ${this.name}, completed=${this.completed}, ` +
      `isNext=${this.isNext}, clickable=${this.clickable})`
    );
  }
}
