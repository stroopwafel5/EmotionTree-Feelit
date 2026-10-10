/**
 * theme.ts
 * --------------------------------------------------------------------------
 * One place for every colour, font and size used in the app.
 *
 * Why one file?
 *  - Kids with autism do best with a calm, CONSISTENT look. Keeping every
 *    colour and size here means every screen looks and behaves the same.
 *  - If you want to change "the purple", you change it once, here.
 *
 * Colour rules from the brief:
 *  - Space theme, main colour = bright purple.
 *  - Level buttons (leaves) use darker purple tints.
 *  - Completed leaf = light purple, locked leaf = grey, next leaf = dark purple.
 *
 * All text colours were picked to keep strong contrast against their
 * background (white text on the purples, dark purple text on the light cards).
 */

/** All colours used in the app. */
export const colors = {
  // --- Space background -----------------------------------------------------
  /** Deep night-sky purple used behind every screen. */
  space: '#1A0B3D',
  /** Slightly lighter purple used for panels that sit on the space background. */
  spacePanel: '#2D1466',
  /** Colour of the little stars. */
  star: '#FFFFFF',

  // --- Main purples ----------------------------------------------------------
  /** Bright purple: the main button colour. */
  purpleBright: '#9333EA',
  /** Glow / accent purple (borders, highlights). */
  purpleGlow: '#C084FC',

  // --- Leaf (level button) colours ------------------------------------------
  /** Completed leaf = light purple hue. */
  leafCompleted: '#D8B4FE',
  /** Text on a completed leaf. */
  leafCompletedText: '#3B0764',
  /** The NEXT leaf = dark purple hue. */
  leafNext: '#5B21B6',
  /** Locked (not completed, not next) leaf = grey hue. */
  leafLocked: '#9CA3AF',
  /** Text on a locked leaf. */
  leafLockedText: '#1F2937',

  // --- Cards and text ---------------------------------------------------------
  /** Light lavender card (explanations, questions) - easy to read on. */
  card: '#F5EEFF',
  /** Main text colour on light cards. */
  textDark: '#2E1065',
  /** Main text colour on the dark space background. */
  textLight: '#FFFFFF',
  /** Softer text colour on the dark background (hints, small print). */
  textSoft: '#E9D5FF',

  // --- Quiz feedback -----------------------------------------------------------
  /** Right answer highlight. */
  correct: '#16A34A',
  /** Wrong answer highlight. */
  wrong: '#DC2626',

  // --- Kahoot-style answer buttons -----------------------------------------
  /** Four friendly colours for the four answer buttons (no red/green, so the
   *  right/wrong highlight always stands out). */
  answers: ['#7C3AED', '#2563EB', '#DB2777', '#0F766E'],

  // --- Rainbow (for the "rainbow tree" path) --------------------------------
  rainbow: ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#A855F7'],
} as const;

/**
 * Fonts.
 * We use "Lexend", a free font designed to make reading easier
 * (SIL Open Font License). The .ttf files live in
 * android/app/src/main/assets/fonts/ and Android finds them by file name.
 *
 * NOTE: with custom fonts on Android, pick the weight by choosing the file
 * (Regular / SemiBold / Bold). Do not also set `fontWeight`.
 */
export const fonts = {
  regular: 'Lexend-Regular',
  semiBold: 'Lexend-SemiBold',
  bold: 'Lexend-Bold',
} as const;

/** Text sizes. Big on purpose: easy to read for young children. */
export const fontSizes = {
  small: 16,
  body: 20,
  large: 24,
  title: 30,
  huge: 40,
} as const;

/** Spacing steps, so gaps look the same everywhere. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Rounded corners. Round shapes feel softer and friendlier. */
export const radius = {
  sm: 12,
  md: 20,
  lg: 28,
  round: 999,
} as const;

/** Minimum size of anything a child can tap (bigger than the usual 48). */
export const minTouchSize = 64;
