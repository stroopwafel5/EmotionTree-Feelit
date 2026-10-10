/**
 * MyTree.tsx
 * --------------------------------------------------------------------------
 * The child's "rainbow tree": the Duolingo-style PATH of leaves.
 *
 *   NOTE (from the brief): this has NOTHING to do with the "tree" data
 *   structure. It is simply the path of levels the child sees.
 *
 * Brief:  class MyTree (int id, int UserId, Leaf[] leaves)
 *
 * Functions from the brief:
 *  - getTree() : a "toArray" function. It returns the leaves array written
 *                out as a String, e.g. "[Leaf(1, Happiness, ...), ...]".
 *                (Use getLeaves() if you want the real array of Leaf objects.)
 *  - draw()    : draws the purple Duolingo-like path. It goes over ALL leaves:
 *                  completed leaf -> light purple
 *                  locked leaf    -> grey
 *                  next leaf      -> dark purple
 *                Only leaves with clickable = true can be tapped.
 *
 * Added helpers:
 *  - fromLevels()       : builds a tree straight from a list of Levels.
 *  - updateLeaf()       : swaps in a new leaf (used when a level is finished).
 *  - updateNextLeaf()   : works out which leaf is "next".
 *  - getLeafColors()    : the colour rules above, in one testable function.
 *  - getLeafOffset()    : the left/right zig-zag of the path.
 *  - getSections()      : the planets (groups of leaves) and their progress.
 *
 * Planets: leaves can belong to a planet (Leaf.section), like Duolingo's
 * units. draw() shows a planet heading where a new planet starts.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import AppText from '../components/AppText';
import LeafButton from '../components/LeafButton';
import PathDots from '../components/PathDots';
import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';
import { Leaf } from './Leaf';
import type { Level } from './Level';

/** The colours of one leaf on screen. */
export interface LeafColors {
  background: string;
  text: string;
  border: string;
}

/** One planet (group of leaves) and its progress. */
export interface SectionProgress {
  /** e.g. "🪐 Planet 1: Basic Feelings" */
  title: string;
  /** Leaves finished on this planet. */
  done: number;
  /** All leaves on this planet. */
  total: number;
}

/** How far (in pixels) a leaf moves left/right to make the zig-zag path. */
const ZIGZAG = [0, 70, 0, -70];

export class MyTree {
  private id: number;
  private userId: number;
  private leaves: Leaf[];

  /**
   * @param id     Tree number.
   * @param userId The account this tree belongs to (progress is per child).
   * @param leaves The leaves, in play order.
   */
  constructor(id: number, userId: number, leaves: Leaf[]) {
    this.id = id;
    this.userId = userId;
    this.leaves = [...leaves];
    // Make sure exactly the right leaf is marked as "next".
    this.updateNextLeaf();
  }

  /** Builds a tree from levels by turning each Level into a Leaf. */
  static fromLevels(id: number, userId: number, levels: Level[]): MyTree {
    return new MyTree(
      id,
      userId,
      levels.map(level => level.toLeaf()),
    );
  }

  // ------------------------------------------------------------------------
  // Getters
  // ------------------------------------------------------------------------

  getId(): number {
    return this.id;
  }

  getUserId(): number {
    return this.userId;
  }

  /** The real array of Leaf objects (a copy). */
  getLeaves(): Leaf[] {
    return [...this.leaves];
  }

  /**
   * getTree(): the "toArray" function from the brief.
   * Returns the leaves array as a String. Handy for logging / debugging:
   *   console.log(tree.getTree());
   */
  getTree(): string {
    return `[${this.leaves.map(leaf => leaf.toString()).join(', ')}]`;
  }

  /** The leaf the child should play next, or undefined when all are done. */
  getNextLeaf(): Leaf | undefined {
    return this.leaves.find(leaf => leaf.isNext);
  }

  /** How many leaves are finished. */
  getCompletedCount(): number {
    return this.leaves.filter(leaf => leaf.completed).length;
  }

  /** True when every leaf is finished (the rainbow tree is full!). */
  isFinished(): boolean {
    return this.leaves.every(leaf => leaf.completed);
  }

  /**
   * The planets in path order, with how many of their leaves are done.
   * Leaves without a planet are left out.
   */
  getSections(): SectionProgress[] {
    const sections: SectionProgress[] = [];
    for (const leaf of this.leaves) {
      if (!leaf.section) {
        continue;
      }
      let section = sections.find(sec => sec.title === leaf.section);
      if (!section) {
        section = { title: leaf.section, done: 0, total: 0 };
        sections.push(section);
      }
      section.total += 1;
      if (leaf.completed) {
        section.done += 1;
      }
    }
    return sections;
  }

  // ------------------------------------------------------------------------
  // Changing the tree
  // ------------------------------------------------------------------------

  /**
   * Puts a new version of a leaf into the tree (matched by id), then works
   * out the next leaf again. Level.finish() calls this.
   */
  updateLeaf(newLeaf: Leaf): void {
    this.leaves = this.leaves.map(leaf =>
      leaf.id === newLeaf.id ? newLeaf : leaf,
    );
    this.updateNextLeaf();
  }

  /**
   * The "next" leaf is the FIRST leaf that is not completed yet.
   * Every other leaf gets isNext = false.
   * When all leaves are completed, no leaf is next.
   */
  updateNextLeaf(): void {
    const nextIndex = this.leaves.findIndex(leaf => !leaf.completed);
    this.leaves = this.leaves.map((leaf, index) =>
      leaf.withIsNext(index === nextIndex),
    );
  }

  // ------------------------------------------------------------------------
  // Drawing helpers (kept separate so they are easy to test)
  // ------------------------------------------------------------------------

  /**
   * The colour rules from the brief:
   *   completed -> light purple, next -> dark purple, otherwise -> grey.
   */
  static getLeafColors(leaf: Leaf): LeafColors {
    switch (leaf.getStatus()) {
      case 'completed':
        return {
          background: colors.leafCompleted,
          text: colors.leafCompletedText,
          border: colors.purpleGlow,
        };
      case 'next':
        return {
          background: colors.leafNext,
          text: colors.textLight,
          // A white ring makes the next leaf easy to spot on the dark sky.
          border: colors.textLight,
        };
      default:
        return {
          background: colors.leafLocked,
          text: colors.leafLockedText,
          border: colors.leafLocked,
        };
    }
  }

  /** Left/right shift of the leaf at `index`: 0, right, 0, left, 0, ... */
  static getLeafOffset(index: number): number {
    return ZIGZAG[index % ZIGZAG.length];
  }

  // ------------------------------------------------------------------------
  // draw()
  // ------------------------------------------------------------------------

  /**
   * draw(): draws the purple Duolingo-like path.
   *
   * It goes over ALL the leaves, top to bottom. Between two leaves it draws
   * a few dots. The dots become a rainbow colour once the leaf above them is
   * finished, so the rainbow "grows" as the child plays. Where a new planet
   * starts, it draws the planet's heading.
   *
   * @param onLeafPress      Called with the leaf id when a CLICKABLE leaf is
   *                         tapped. Locked leaves get no onPress at all.
   * @param onNextLeafLayout Optional. Called with the next leaf's position
   *                         (y, in pixels from the top of the path), so the
   *                         screen can scroll to it.
   */
  draw(
    onLeafPress: (leafId: number) => void,
    onNextLeafLayout?: (y: number) => void,
  ): React.ReactElement {
    const sections = this.getSections();

    return (
      <View style={styles.path}>
        {this.leaves.map((leaf, index) => {
          const offset = MyTree.getLeafOffset(index);
          const leafAbove = index > 0 ? this.leaves[index - 1] : undefined;
          // A new planet starts here when the planet label changes.
          const newSection =
            leaf.section !== '' &&
            (leafAbove === undefined || leafAbove.section !== leaf.section);
          const section = sections.find(sec => sec.title === leaf.section);

          return (
            <View
              key={leaf.id}
              style={styles.step}
              onLayout={
                leaf.isNext && onNextLeafLayout
                  ? event => onNextLeafLayout(event.nativeEvent.layout.y)
                  : undefined
              }>
              {/* Dots that join this leaf to the one above it. */}
              {leafAbove && (
                <PathDots
                  fromOffset={MyTree.getLeafOffset(index - 1)}
                  toOffset={offset}
                  color={
                    leafAbove.completed
                      ? colors.rainbow[(index - 1) % colors.rainbow.length]
                      : colors.leafLocked
                  }
                />
              )}

              {/* Planet heading, like a Duolingo unit. */}
              {newSection && section && (
                <View style={styles.sectionHeader} accessibilityRole="header">
                  <AppText style={styles.sectionTitle}>{section.title}</AppText>
                  <AppText style={styles.sectionCount}>
                    {section.done} of {section.total} leaves done
                  </AppText>
                </View>
              )}

              {/* The leaf itself. Only clickable leaves get onPress. */}
              <LeafButton
                leaf={leaf}
                leafColors={MyTree.getLeafColors(leaf)}
                offset={offset}
                onPress={
                  leaf.clickable ? () => onLeafPress(leaf.id) : undefined
                }
              />
            </View>
          );
        })}

        {/* The goal at the end of the path. */}
        <View
          style={[
            styles.goal,
            this.isFinished() ? styles.goalDone : styles.goalWaiting,
          ]}>
          <AppText style={styles.goalIcon}>
            {this.isFinished() ? '🌈' : '⭐'}
          </AppText>
          <AppText style={styles.goalText}>
            {this.isFinished()
              ? 'You did it! Your rainbow tree is full!'
              : `Leaves done: ${this.getCompletedCount()} of ${
                  this.leaves.length
                }`}
          </AppText>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  path: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  step: {
    alignItems: 'center',
  },
  sectionHeader: {
    alignSelf: 'stretch',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.spacePanel,
    borderWidth: 2,
    borderColor: colors.purpleGlow,
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.35,
    textAlign: 'center',
  },
  sectionCount: {
    color: colors.textSoft,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  goal: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 3,
    maxWidth: 320,
  },
  goalWaiting: {
    backgroundColor: colors.spacePanel,
    borderColor: colors.purpleGlow,
  },
  goalDone: {
    backgroundColor: colors.purpleBright,
    borderColor: colors.rainbow[2],
  },
  goalIcon: {
    fontSize: fontSizes.huge,
    lineHeight: fontSizes.huge + 12,
  },
  goalText: {
    color: colors.textLight,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
});
