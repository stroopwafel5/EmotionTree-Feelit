/**
 * extras.tsx
 * --------------------------------------------------------------------------
 * Drawings for the Space Shop items that both the child's avatar and the
 * space buddy can wear: flames (fire powers), a guitar, rainbow wings and
 * bat wings. Each part is drawn once around (0, 0) and then moved and sized
 * with `x`, `y` and `size`, so the same drawing fits a kid or a small cat.
 *
 * Simple shapes only (react-native-svg) - no picture files, no AI art.
 */
import React from 'react';
import { Circle, G, Path, Rect } from 'react-native-svg';

interface PlaceProps {
  /** Where the part's anchor point goes. */
  x: number;
  y: number;
  /** 1 = normal size. */
  size?: number;
  /** Draw it mirrored (for the right-hand wing). */
  flip?: boolean;
}

const place = ({ x, y, size = 1, flip = false }: PlaceProps) =>
  `translate(${x} ${y}) scale(${flip ? -size : size} ${size})`;

/** A flame standing on its anchor point (fire powers). */
export function Flame(props: PlaceProps) {
  return (
    <G transform={place(props)}>
      <Path
        d="M0 0 C-15 -6 -17 -22 -9 -34 C-7 -27 -3 -25 -1 -27 C-3 -39 4 -49 12 -57 C10 -43 19 -35 19 -21 C19 -8 11 0 0 0 Z"
        fill="#F97316"
        stroke="#C2410C"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M2 -3 C-6 -7 -8 -17 -2 -25 C0 -19 4 -19 6 -23 C6 -15 12 -11 10 -5 C8 -1 6 -3 2 -3 Z"
        fill="#FDE047"
      />
    </G>
  );
}

/** A little spark (for fire powers). */
export function Spark({ x, y, r = 2.5 }: { x: number; y: number; r?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#FDE047" />
      <Circle cx={x} cy={y} r={r * 0.45} fill="#FFFFFF" />
    </G>
  );
}

/**
 * A guitar. The anchor is the middle of the big round part; the neck
 * points up and to the left.
 */
export function Guitar(props: PlaceProps) {
  return (
    <G transform={place(props)}>
      {/* neck + head */}
      <Path d="M-12 -12 L-50 -50" stroke="#78350F" strokeWidth={7} strokeLinecap="round" />
      <Path d="M-50 -50 L-60 -60" stroke="#451A03" strokeWidth={11} strokeLinecap="round" />
      <Circle cx={-61} cy={-53} r={2} fill="#FDE68A" />
      <Circle cx={-53} cy={-61} r={2} fill="#FDE68A" />
      {/* body: outline first, then the wood on top */}
      <Circle cx={-10} cy={-10} r={16.5} fill="#92400E" />
      <Circle cx={5} cy={5} r={22.5} fill="#92400E" />
      <Circle cx={-10} cy={-10} r={14} fill="#F59E0B" />
      <Circle cx={5} cy={5} r={20} fill="#F59E0B" />
      <Circle cx={-2} cy={-2} r={6.5} fill="#451A03" />
      <Rect x={6} y={10} width={14} height={5} rx={2} fill="#78350F" transform="rotate(-45 13 12.5)" />
      {/* strings */}
      <G stroke="#FEF3C7" strokeWidth={0.9}>
        <Path d="M14 11 L-54 -57" />
        <Path d="M11 14 L-57 -54" />
      </G>
    </G>
  );
}

/** One wing shape, attached at (0, 0) and spreading out to the left. */
const WING = 'M0 0 Q-42 -70 -66 -40 Q-76 -8 -42 6 Q-70 28 -50 56 Q-26 70 0 28 Z';
const RAINBOW = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#A855F7'];

/** A rainbow wing (use flip for the right side). */
export function RainbowWing(props: PlaceProps) {
  return (
    <G transform={place(props)}>
      <Path d={WING} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={5} strokeLinejoin="round" />
      {RAINBOW.map((color, i) => (
        <Path key={color} d={WING} fill={color} transform={`scale(${1 - i * 0.14})`} />
      ))}
    </G>
  );
}

/** A bat wing (Halloween!). */
export function BatWing(props: PlaceProps) {
  return (
    <G transform={place(props)}>
      <Path
        d="M0 0 Q-26 -34 -60 -26 Q-52 -16 -56 -4 Q-44 -8 -40 6 Q-30 -2 -24 12 Q-16 2 0 10 Z"
        fill="#2E1065"
        stroke="#C4B5FD"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <G stroke="#8B5CF6" strokeWidth={1.8} fill="none" strokeLinecap="round">
        <Path d="M0 2 L-50 -22" />
        <Path d="M0 4 L-42 -4" />
        <Path d="M0 6 L-26 8" />
      </G>
    </G>
  );
}
