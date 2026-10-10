/**
 * Explanation.ts
 * --------------------------------------------------------------------------
 * The short lesson shown BEFORE the quiz (Part 1 of a leaf).
 *
 * Brief:  Explanation (int id, string[] photos, String explanation, String howToHelp)
 *
 * The 3 parts from the brief:
 *   1. photos      - example photos of real people showing the feeling
 *                    (ids that point into src/data/photos.json)
 *   2. explanation - what the feeling is and how to tell someone feels it
 *   3. howToHelp   - what we can do to help. (Text for now; the brief plans
 *                    hand-made animations for this part later.)
 *
 * Added (all optional, so old lessons still work):
 *   4. examples       - short stories about kids and space friends, e.g.
 *                       "Dina really likes playing ball. It makes her happy!"
 *   5. askYou         - a question for the child in a speech balloon,
 *                       e.g. "What makes YOU happy?"
 *   6. howToHelpTitle - a different heading for part 3, e.g.
 *                       "How to handle fear" instead of "How can we help?"
 *
 * The lessons live in src/data/explanations.json.
 * In that file, "explanation" and "howToHelp" can be written as a LIST of
 * short lines (easiest to edit) or as one text with \n between lines.
 */

/** One short story in the lesson ("Dina really likes playing ball..."). */
export interface Example {
  /** Who the story is about, e.g. "Dina" or "Zib the alien". */
  name: string;
  /** Emoji shown as the character's picture, e.g. "👧" or "👽". */
  icon: string;
  /** The story itself, in one or two short sentences. */
  text: string;
}

/** The shape of one explanation inside explanations.json. */
export interface ExplanationJson {
  id: number;
  photos: string[];
  explanation: string | string[];
  howToHelp: string | string[];
  howToHelpTitle?: string;
  examples?: Example[];
  askYou?: string;
}

/** The heading of part 3 when explanations.json does not give one. */
export const DEFAULT_HOW_TO_HELP_TITLE = 'How can we help? 🤝';

export class Explanation {
  /**
   * @param id             Same number as the level it belongs to.
   * @param photos         Photo ids from photos.json.
   * @param explanation    What the feeling is + how to tell (easy English).
   * @param howToHelp      How we can help (or how to handle it).
   * @param examples       Short stories (added, optional).
   * @param askYou         Question for the child's speech balloon (added, optional).
   * @param howToHelpTitle Heading for the howToHelp part (added, optional).
   */
  constructor(
    public readonly id: number,
    public readonly photos: string[],
    public readonly explanation: string,
    public readonly howToHelp: string,
    public readonly examples: Example[] = [],
    public readonly askYou: string = '',
    public readonly howToHelpTitle: string = DEFAULT_HOW_TO_HELP_TITLE,
  ) {}

  /** Builds an Explanation from one entry of explanations.json. */
  static fromJson(json: ExplanationJson): Explanation {
    return new Explanation(
      json.id,
      json.photos,
      joinLines(json.explanation),
      joinLines(json.howToHelp),
      json.examples ?? [],
      json.askYou ?? '',
      json.howToHelpTitle ?? DEFAULT_HOW_TO_HELP_TITLE,
    );
  }

  /**
   * Splits the explanation into short lines.
   * Short separate lines are much easier to read than one long paragraph.
   */
  getExplanationLines(): string[] {
    return splitLines(this.explanation);
  }

  /** Splits the "how to help" text into short lines. */
  getHowToHelpLines(): string[] {
    return splitLines(this.howToHelp);
  }

  /** True when the lesson has stories to show. */
  hasExamples(): boolean {
    return this.examples.length > 0;
  }
}

/** A list of lines becomes one text with a new line between each line. */
function joinLines(text: string | string[]): string {
  return Array.isArray(text) ? text.join('\n') : text;
}

/** Splits text on new lines and drops empty lines. */
function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}
