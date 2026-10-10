/**
 * Level.tsx
 * --------------------------------------------------------------------------
 * One level of the game: one feeling (Happiness, Sadness, ...).
 *
 * Brief:  Level (int id, String name, Explanation explanation,
 *                Question[] questions, bool completed)
 *
 * Functions from the brief:
 *  - getters and setters for every field
 *  - toLeaf() : turns the level into a Leaf that MyTree can draw
 *  - play()   : shows the Explanation first, then the questions one by one.
 *               Right answer  -> green + "Well Done! You did Great!" popup.
 *               Wrong answer  -> red   + "Oh no… Let's try this again later!" popup.
 *               After the popup the child moves on to the next question.
 *
 * Added:
 *  - `icon` (optional constructor argument): emoji for the leaf.
 *  - `section` (optional last constructor argument): the planet label,
 *    e.g. "🪐 Planet 1: Basic Feelings".
 *  - finish(): called when the child has answered ALL questions. It sets
 *    completed = TRUE, gives MyTree the new leaf, and asks the screen to
 *    draw the tree again (the brief: "Level iterates a draw function and
 *    refreshes the way the MyTree looks").
 *
 * Why is this a .tsx file?
 *  play() returns something to show on screen (a React element), and that
 *  needs JSX. The actual screen is built in components/LevelPlayer.tsx so
 *  this class stays short and easy to read.
 */
import React from 'react';

import LevelPlayer from '../components/LevelPlayer';
import { Explanation } from './Explanation';
import { Leaf } from './Leaf';
import type { MyTree } from './MyTree';
import { Question } from './Question';

export class Level {
  private id: number;
  private name: string;
  private explanation: Explanation;
  private questions: Question[];
  private completed: boolean;
  private icon: string;
  private section: string;

  /**
   * @param id          Level number (1 = Happiness ... 5 = Annoyedness).
   * @param name        Level name shown on the leaf.
   * @param explanation The lesson shown before the quiz.
   * @param questions   The quiz questions, in order.
   * @param completed   True when the child already finished this level.
   * @param icon        Emoji for the leaf (added, optional).
   * @param section     Planet label (added, optional).
   */
  constructor(
    id: number,
    name: string,
    explanation: Explanation,
    questions: Question[],
    completed: boolean = false,
    icon: string = '🍃',
    section: string = '',
  ) {
    this.id = id;
    this.name = name;
    this.explanation = explanation;
    this.questions = questions;
    this.completed = completed;
    this.icon = icon;
    this.section = section;
  }

  // ------------------------------------------------------------------------
  // Getters
  // ------------------------------------------------------------------------

  getId(): number {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getExplanation(): Explanation {
    return this.explanation;
  }

  /** Returns a copy, so nobody can change the list by accident. */
  getQuestions(): Question[] {
    return [...this.questions];
  }

  isCompleted(): boolean {
    return this.completed;
  }

  getIcon(): string {
    return this.icon;
  }

  getSection(): string {
    return this.section;
  }

  // ------------------------------------------------------------------------
  // Setters
  // ------------------------------------------------------------------------

  setId(id: number): void {
    this.id = id;
  }

  setName(name: string): void {
    this.name = name;
  }

  setExplanation(explanation: Explanation): void {
    this.explanation = explanation;
  }

  setQuestions(questions: Question[]): void {
    this.questions = [...questions];
  }

  setCompleted(completed: boolean): void {
    this.completed = completed;
  }

  setIcon(icon: string): void {
    this.icon = icon;
  }

  setSection(section: string): void {
    this.section = section;
  }

  // ------------------------------------------------------------------------
  // Brief functions
  // ------------------------------------------------------------------------

  /**
   * toLeaf(): turns this level into a Leaf that MyTree can draw.
   *
   * A level does not know on its own whether it is "the next one" - that
   * depends on the other levels. So MyTree passes `isNext` in (it is false
   * by default) and MyTree.updateNextLeaf() fixes it up afterwards anyway.
   */
  toLeaf(isNext: boolean = false): Leaf {
    return new Leaf(
      this.id,
      this.name,
      this.completed,
      isNext,
      this.icon,
      this.section,
    );
  }

  /**
   * play(): returns the level screen.
   *
   * The screen (components/LevelPlayer.tsx) does exactly what the brief asks:
   *   1. shows the Explanation (photos, what the feeling is, how to help)
   *   2. shows the questions one after the other
   *   3. green + "Well Done!" popup for a right answer,
   *      red + "Oh no…" popup for a wrong answer, then the next question
   *   4. after the last question it calls `this.finish(...)`
   *
   * @param tree          The child's tree, so the level can update it.
   * @param onTreeChanged Called after the tree changed, so the screen redraws it.
   * @param onExit        Called when the child taps "Back to my tree".
   * @param rewards       Space candies (added, optional): what to call for a
   *                      right answer, and how many candies to show.
   */
  play(
    tree: MyTree,
    onTreeChanged: () => void,
    onExit: () => void,
    rewards?: { onCorrectAnswer: () => void; perAnswer: number; finishBonus: number },
  ): React.ReactElement {
    return (
      <LevelPlayer
        // `key` makes React start fresh when a different level is played.
        key={this.id}
        level={this}
        onAllQuestionsAnswered={() => this.finish(tree, onTreeChanged)}
        onExit={onExit}
        onCorrectAnswer={rewards?.onCorrectAnswer}
        candiesPerAnswer={rewards?.perAnswer}
        finishBonus={rewards?.finishBonus}
      />
    );
  }

  /**
   * finish(): the child answered every question.
   *  1. completed turns TRUE
   *  2. the tree gets the new leaf (and works out which leaf is next)
   *  3. we ask the screen to draw the tree again
   */
  finish(tree: MyTree, onTreeChanged: () => void): void {
    this.setCompleted(true);
    tree.updateLeaf(this.toLeaf());
    onTreeChanged();
  }
}
