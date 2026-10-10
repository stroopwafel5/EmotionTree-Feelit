/**
 * Question.ts
 * --------------------------------------------------------------------------
 * One quiz question (Part 2 of a leaf).
 *
 * Brief:  Question (int id, String question, String[] answers, String correct)
 *
 * Added on top of the brief (all optional):
 *  - `image`    : the id of a photo (from src/data/photos.json) the child
 *                 looks at to answer, e.g. "happy-4".
 *  - `scene`    : a short story to read instead of (or under) the photo,
 *                 e.g. "A kid is playing with a toy. You want it too, and
 *                 you feel bad inside." Great for real-life situations that
 *                 are hard to show in one photo.
 *  - `sceneIcon`: an emoji shown big on the story card, e.g. "🧸".
 *
 * Every question needs a photo, a story, or both.
 *
 * The questions live in src/data/questions.json. MainScreen reads that file
 * and turns every entry into a Question with `Question.fromJson`.
 */

/** The shape of one question inside questions.json. */
export interface QuestionJson {
  id: number;
  levelId: number;
  image?: string;
  scene?: string;
  sceneIcon?: string;
  question: string;
  answers: string[];
  correct: string;
}

export class Question {
  /**
   * @param id        Unique number for this question.
   * @param question  The text the child reads, e.g. "What is the kid feeling?".
   * @param answers   Exactly 4 possible answers (like Kahoot).
   * @param correct   The right answer. Must be one of `answers`.
   * @param image     Photo id from photos.json (added, optional).
   * @param scene     Short story shown on a card (added, optional).
   * @param sceneIcon Emoji for the story card (added, optional).
   */
  constructor(
    public readonly id: number,
    public readonly question: string,
    public readonly answers: string[],
    public readonly correct: string,
    public readonly image?: string,
    public readonly scene?: string,
    public readonly sceneIcon: string = '💭',
  ) {
    // Guard against typos in questions.json: a question whose right answer is
    // not in the list could never be answered correctly.
    if (!answers.includes(correct)) {
      throw new Error(
        `Question ${id}: the correct answer "${correct}" is not one of its answers.`,
      );
    }
    // The child needs something to look at: a photo or a story.
    if (!image && !scene) {
      throw new Error(`Question ${id}: it needs an "image" or a "scene".`);
    }
  }

  /**
   * Builds a Question from one entry of questions.json.
   * (The `levelId` field is used by MainScreen to group questions; the
   * Question itself does not need to know which level it belongs to.)
   */
  static fromJson(json: QuestionJson): Question {
    return new Question(
      json.id,
      json.question,
      json.answers,
      json.correct,
      json.image,
      json.scene,
      json.sceneIcon,
    );
  }

  /** True when `answer` is the right answer to this question. */
  isCorrect(answer: string): boolean {
    return answer === this.correct;
  }
}
