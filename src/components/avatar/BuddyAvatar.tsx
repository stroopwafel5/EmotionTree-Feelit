/**
 * BuddyAvatar.tsx
 * --------------------------------------------------------------------------
 * Draws the child's space buddy from a Pet: a CAT, a DOG or a GREEN ALIEN,
 * in a bouncy cartoon style (soft outlines, big shiny eyes, rosy cheeks),
 * with its style, colour, accessories AND ITS FACE ("mood"):
 *
 *   happy (smile) · grin · silly (tongue out + wink) · love (heart eyes)
 *   surprised ("Wow!") · sleepy (zZz) · sad (frown + tear) · grumpy
 *   mirror = "Same as me": the buddy copies how the child feels right now
 *
 * Space Shop items (bought with space candies): cool shades, pumpkin hat,
 * tiny guitar, super cape, bat wings, rainbow wings, fire powers.
 *
 *   cat   styles: plain, stripes, patches
 *   dog   styles: floppy ears, pointy ears, spots
 *   alien styles: one antenna, two antennae, three eyes
 *
 * Simple shapes only (react-native-svg) - no picture files, no AI art.
 *
 * Usage:  <BuddyAvatar pet={user.pet} size={120} ownerFeeling={user.feeling} />
 * The drawing is made on a 160 x 160 grid.
 */
import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import type { Pet } from '../../models/Pet';
import { BatWing, Flame, Guitar, RainbowWing, Spark } from './extras';
import { darker, lighter } from './shade';

const INK = '#2B1B17'; // pupils, mouths, eyebrows
const MOUTH = '#9F1239'; // inside an open mouth
const TONGUE = '#F472B6';
const BLUSH = '#FB7185';
const TEAR = '#60A5FA';

/** For "Same as me": which buddy face goes with each feeling in feelings.json. */
const MOOD_FOR_FEELING: Record<string, string> = {
  happy: 'happy',
  excited: 'grin',
  calm: 'happy',
  tired: 'sleepy',
  sad: 'sad',
  scared: 'surprised',
  angry: 'grumpy',
  annoyed: 'grumpy',
  jealous: 'grumpy',
  overwhelmed: 'surprised',
};

/** The face to draw: the buddy's own mood, or the owner's feeling for "mirror". */
export function buddyFace(pet: Pet, ownerFeeling?: string | null): string {
  const mood = pet.getMood();
  if (mood === 'mirror') {
    return (ownerFeeling && MOOD_FOR_FEELING[ownerFeeling]) || 'happy';
  }
  return mood;
}

interface BuddyAvatarProps {
  pet: Pet;
  size?: number;
  /** The owner's feeling id (only used when the buddy's face is "Same as me"). */
  ownerFeeling?: string | null;
  /** Show this face instead (the buddy reacting while it talks: "sad", "grin"...). */
  mood?: string | null;
}

export default function BuddyAvatar({ pet, size = 120, ownerFeeling = null, mood = null }: BuddyAvatarProps) {
  const kind = pet.getKind();
  const style = pet.look.hair.id;
  const color = pet.look.skin.color || '#4ADE80';
  const face = mood && mood !== 'mirror' ? mood : buddyFace(pet, ownerFeeling);
  const parts: PartProps = {
    color,
    dark: darker(color, 0.25),
    light: lighter(color, 0.45),
    line: darker(color, 0.5),
    style,
    face,
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      accessible
      accessibilityLabel={`${pet.name}, a ${kind}, ${pet.look.mood?.name ?? 'smiling'}`}>
      {/* ---- shop items BEHIND the buddy ---- */}
      {pet.look.has('petFirePowers') && (
        <G>
          <Flame x={26} y={154} size={0.8} />
          <Flame x={134} y={154} size={0.8} flip />
          <Flame x={44} y={156} size={0.45} flip />
          <Flame x={116} y={156} size={0.45} />
        </G>
      )}
      {pet.look.has('petCape') && (
        <Path d="M58 104 Q80 98 102 104 L124 154 Q80 162 36 154 Z" fill="#DC2626" stroke="#991B1B" strokeWidth={2.5} strokeLinejoin="round" />
      )}
      {pet.look.has('batWings') && (
        <G>
          <BatWing x={52} y={126} size={0.9} />
          <BatWing x={108} y={126} size={0.9} flip />
        </G>
      )}
      {pet.look.has('petRainbowWings') && (
        <G>
          <RainbowWing x={60} y={118} size={0.55} />
          <RainbowWing x={100} y={118} size={0.55} flip />
        </G>
      )}

      {kind === 'cat' && <Cat {...parts} />}
      {kind === 'dog' && <Dog {...parts} />}
      {kind === 'alien' && <Alien {...parts} />}

      {/* ---- accessories ---- */}
      {pet.look.has('petCape') && <Circle cx={80} cy={105} r={4.5} fill="#FACC15" stroke="#A16207" strokeWidth={1.5} />}
      {pet.look.has('petGuitar') && <Guitar x={94} y={132} size={0.5} />}
      {pet.look.has('petShades') && <Shades kind={kind} style={style} />}
      {pet.look.has('pumpkinHat') && (
        <G>
          <Path d="M80 9 Q79 2 85 -1" stroke="#15803D" strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d="M82 6 Q92 0 96 6 Q88 10 82 6 Z" fill="#22C55E" stroke="#15803D" strokeWidth={1.2} />
          <Ellipse cx={80} cy={21} rx={21} ry={14} fill="#F97316" stroke="#C2410C" strokeWidth={2.5} />
          <Ellipse cx={80} cy={21} rx={9} ry={14} fill="none" stroke="#EA580C" strokeWidth={2} />
        </G>
      )}
      {pet.look.has('petFirePowers') && (
        <G>
          <Spark x={20} y={92} />
          <Spark x={142} y={88} />
          <Spark x={28} y={64} r={2} />
          <Spark x={134} y={58} r={2} />
        </G>
      )}
      {pet.look.has('scarf') && (
        <G stroke="#991B1B" strokeWidth={2.5} strokeLinejoin="round">
          <Rect x={52} y={100} width={56} height={13} rx={6.5} fill="#EF4444" />
          <Path d="M94 108 L106 134 L95 136 L87 112 Z" fill="#DC2626" />
          <Path d="M60 101 L60 112 M70 101 L70 112" stroke="#FCA5A5" strokeWidth={2} />
        </G>
      )}
      {pet.look.has('bowTie') && (
        <G stroke="#4C1D95" strokeWidth={2.5} strokeLinejoin="round">
          <Path d="M80 107 L63 97 L63 117 Z" fill="#8B5CF6" />
          <Path d="M80 107 L97 97 L97 117 Z" fill="#8B5CF6" />
          <Circle cx={80} cy={107} r={5} fill="#6D28D9" />
        </G>
      )}
      {pet.look.has('crown') && (
        <G>
          <Polygon
            points="60,30 63,10 72,21 80,5 88,21 97,10 100,30"
            fill="#FACC15"
            stroke="#A16207"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <Circle cx={80} cy={22} r={3.5} fill="#EF4444" />
          <Circle cx={68} cy={25} r={2.5} fill="#3B82F6" />
          <Circle cx={92} cy={25} r={2.5} fill="#22C55E" />
        </G>
      )}
      {pet.look.has('spaceHelmet') && (
        <G>
          <Circle cx={80} cy={64} r={57} fill="#BAE6FD" fillOpacity={0.16} stroke="#7DD3FC" strokeWidth={4} />
          <Path d="M44 40 Q54 22 74 16" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.85} />
          <Circle cx={40} cy={54} r={3} fill="#FFFFFF" opacity={0.85} />
        </G>
      )}
    </Svg>
  );
}

// ===========================================================================
// Shared parts
// ===========================================================================

/** Where the buddy's eyes are (for the cool shades). */
function eyeSpots(kind: string, style: string): { eyes: [number, number][]; s: number } {
  if (kind === 'cat') {
    return { eyes: [[62, 64], [98, 64]], s: 10 };
  }
  if (kind === 'dog') {
    return { eyes: [[63, 60], [97, 60]], s: 10 };
  }
  if (style === 'threeEyes') {
    return { eyes: [[54, 68], [80, 54], [106, 68]], s: 9 };
  }
  return { eyes: [[60, 64], [100, 64]], s: 13 };
}

/** Cool shades: one dark lens over each eye (three for a three-eyed alien!). */
function Shades({ kind, style }: { kind: string; style: string }) {
  const { eyes, s } = eyeSpots(kind, style);
  const w = s * 2.6;
  const h = s * 2;
  const first = eyes[0];
  const last = eyes[eyes.length - 1];
  return (
    <G>
      <G stroke="#000000" strokeWidth={3} fill="none" strokeLinecap="round">
        {eyes.slice(1).map(([x, y], i) => {
          const [px, py] = eyes[i];
          return <Path key={x} d={`M${px + w / 2} ${py - s * 0.3} Q${(px + x) / 2} ${Math.min(py, y) - s * 0.9} ${x - w / 2} ${y - s * 0.3}`} />;
        })}
        <Path d={`M${first[0] - w / 2} ${first[1] - s * 0.3} L${first[0] - w / 2 - s * 1.2} ${first[1] - s * 0.8}`} />
        <Path d={`M${last[0] + w / 2} ${last[1] - s * 0.3} L${last[0] + w / 2 + s * 1.2} ${last[1] - s * 0.8}`} />
      </G>
      {eyes.map(([x, y]) => (
        <G key={x}>
          <Rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={s * 0.6} fill="#111827" stroke="#000000" strokeWidth={2} />
          <Path d={`M${x - w / 4} ${y - h / 4} L${x} ${y + h / 6}`} stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
        </G>
      ))}
    </G>
  );
}

interface PartProps {
  color: string;
  dark: string;
  light: string;
  /** Outline colour (a darker shade of the body: softer than black). */
  line: string;
  style: string;
  face: string;
}

/** A tail / arm drawn as a thick line with an outline. */
function OutlinedStroke({ d, color, line, width }: { d: string; color: string; line: string; width: number }) {
  return (
    <G fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} stroke={line} strokeWidth={width + 5} />
      <Path d={d} stroke={color} strokeWidth={width} />
    </G>
  );
}

/** Two little feet with toe lines. */
function Feet({ fill, line, y = 150 }: { fill: string; line: string; y?: number }) {
  return (
    <G stroke={line} strokeWidth={2.5}>
      <Ellipse cx={66} cy={y} rx={11} ry={7} fill={fill} />
      <Ellipse cx={94} cy={y} rx={11} ry={7} fill={fill} />
      <Path d={`M63 ${y - 3} L63 ${y + 1} M69 ${y - 3} L69 ${y + 1} M91 ${y - 3} L91 ${y + 1} M97 ${y - 3} L97 ${y + 1}`} strokeWidth={1.8} strokeLinecap="round" />
    </G>
  );
}

interface FaceProps {
  face: string;
  /** Eye centres (2, or 3 for the three-eyed alien). */
  eyes: [number, number][];
  /** Eye size (radius). */
  s: number;
  /** Mouth centre and half-width. */
  mouth: [number, number];
  mw: number;
  line: string;
  /** Cats get the "w" mouth when smiling. */
  catMouth?: boolean;
}

/**
 * The buddy's face. Eyes, eyebrows, mouth and little extras change with
 * the mood. Every face keeps rosy cheeks - friendly on purpose.
 */
function Face({ face, eyes, s, mouth, mw, line, catMouth = false }: FaceProps) {
  const [mx, my] = mouth;
  const first = eyes[0];
  const last = eyes[eyes.length - 1];
  const cheekY = Math.max(...eyes.map(e => e[1])) + s * 1.6;
  const blushOpacity = face === 'love' || face === 'grin' || face === 'silly' ? 0.65 : 0.45;

  return (
    <G>
      {/* rosy cheeks */}
      <G fill={BLUSH} opacity={blushOpacity}>
        <Ellipse cx={first[0] - s * 0.6} cy={cheekY} rx={s * 0.75} ry={s * 0.45} />
        <Ellipse cx={last[0] + s * 0.6} cy={cheekY} rx={s * 0.75} ry={s * 0.45} />
      </G>

      {/* eyes */}
      {eyes.map(([x, y], i) => {
        const side = x < 80 ? 'left' : x > 80 ? 'right' : 'middle';
        if (face === 'grin' || (face === 'silly' && i === 0)) {
          return <ClosedHappyEye key={i} x={x} y={y} s={s} />;
        }
        if (face === 'sleepy') {
          return <SleepyEye key={i} x={x} y={y} s={s} />;
        }
        if (face === 'love') {
          return <HeartEye key={i} x={x} y={y} s={s} />;
        }
        return (
          <G key={i}>
            <ShinyEye x={x} y={y} s={s} line={line} small={face === 'surprised'} squint={face === 'grumpy'} />
            {face === 'sad' && <Brow x={x} y={y} s={s} side={side} tilt="sad" />}
            {face === 'grumpy' && <Brow x={x} y={y} s={s} side={side} tilt="cross" />}
            {face === 'surprised' && <Brow x={x} y={y} s={s} side={side} tilt="up" />}
          </G>
        );
      })}

      {/* mouth */}
      <Mouth face={face} x={mx} y={my} w={mw} catMouth={catMouth} />

      {/* little extras */}
      {face === 'sad' && (
        <Path
          d={`M${first[0] - s * 0.5} ${first[1] + s * 1.1} q-4 7 0 9 q4 -2 0 -9 Z`}
          fill={TEAR}
          stroke="#2563EB"
          strokeWidth={1}
        />
      )}
      {face === 'sleepy' && (
        <G stroke="#3B82F6" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M118 30 L128 30 L118 40 L128 40" />
          <Path d="M134 14 L141 14 L134 21 L141 21" strokeWidth={2.5} />
        </G>
      )}
    </G>
  );
}

/** Big cartoon eye: white, a large dark pupil and two shiny dots. */
function ShinyEye({ x, y, s, line, small, squint }: { x: number; y: number; s: number; line: string; small?: boolean; squint?: boolean }) {
  const ry = squint ? s * 0.8 : s * 1.1;
  const pupil = small ? 0.38 : 0.66;
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={s * 0.92} ry={ry} fill="#FFFFFF" stroke={line} strokeWidth={2.2} />
      <Ellipse cx={x + s * 0.08} cy={y + (squint ? s * 0.1 : s * 0.18)} rx={s * pupil} ry={s * pupil * (squint ? 0.95 : 1.15)} fill={INK} />
      <Circle cx={x + s * 0.32} cy={y - s * 0.22} r={s * (small ? 0.16 : 0.26)} fill="#FFFFFF" />
      {!small && <Circle cx={x - s * 0.18} cy={y + s * 0.5} r={s * 0.12} fill="#FFFFFF" />}
    </G>
  );
}

/** ^ shaped eye: a big happy squint. */
function ClosedHappyEye({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <Path
      d={`M${x - s * 0.9} ${y + s * 0.35} Q${x} ${y - s * 1.1} ${x + s * 0.9} ${y + s * 0.35}`}
      stroke={INK}
      strokeWidth={3.5}
      fill="none"
      strokeLinecap="round"
    />
  );
}

/** Sleepy eye: a calm closed curve. */
function SleepyEye({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <Path
      d={`M${x - s * 0.9} ${y} Q${x} ${y + s * 0.8} ${x + s * 0.9} ${y}`}
      stroke={INK}
      strokeWidth={3.5}
      fill="none"
      strokeLinecap="round"
    />
  );
}

/** Heart eye (love). */
function HeartEye({ x, y, s }: { x: number; y: number; s: number }) {
  const k = s * 1.05;
  return (
    <G>
      <Path
        d={`M${x} ${y + k * 0.9} C${x - k * 1.7} ${y - k * 0.1} ${x - k * 0.8} ${y - k * 1.4} ${x} ${y - k * 0.45} C${x + k * 0.8} ${y - k * 1.4} ${x + k * 1.7} ${y - k * 0.1} ${x} ${y + k * 0.9} Z`}
        fill="#EF4444"
        stroke="#991B1B"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Circle cx={x - k * 0.45} cy={y - k * 0.35} r={k * 0.2} fill="#FFFFFF" opacity={0.9} />
    </G>
  );
}

/** One eyebrow. "sad": inner end up. "cross": inner end down. "up": raised high. */
function Brow({ x, y, s, side, tilt }: { x: number; y: number; s: number; side: string; tilt: 'sad' | 'cross' | 'up' }) {
  const by = y - s * 1.65;
  if (tilt === 'up') {
    return (
      <Path d={`M${x - s * 0.7} ${by - 2} Q${x} ${by - s * 0.7} ${x + s * 0.7} ${by - 2}`} stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
    );
  }
  // Which end is the "inner" one (towards the middle of the face)?
  const innerIsRight = side === 'left';
  const innerDy = tilt === 'sad' ? -s * 0.5 : s * 0.5;
  const outerDy = -innerDy;
  const [x1, y1, x2, y2] = innerIsRight
    ? [x - s * 0.8, by + outerDy * 0.5, x + s * 0.7, by + innerDy * 0.5]
    : [x - s * 0.7, by + innerDy * 0.5, x + s * 0.8, by + outerDy * 0.5];
  if (side === 'middle') {
    return <Path d={`M${x - s * 0.7} ${by} L${x + s * 0.7} ${by}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />;
  }
  return <Path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />;
}

/** The mouth for each mood. */
function Mouth({ face, x, y, w, catMouth }: { face: string; x: number; y: number; w: number; catMouth: boolean }) {
  const stroke = { stroke: INK, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (face) {
    case 'grin':
      return (
        <G>
          <Path d={`M${x - w} ${y - 2} Q${x} ${y + w * 1.7} ${x + w} ${y - 2} Z`} fill={MOUTH} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <Ellipse cx={x} cy={y + w * 0.6} rx={w * 0.45} ry={w * 0.25} fill={TONGUE} />
        </G>
      );
    case 'silly':
      return (
        <G>
          <Path d={`M${x - w} ${y} Q${x} ${y + w * 0.9} ${x + w} ${y}`} {...stroke} />
          <Path
            d={`M${x - w * 0.15} ${y + w * 0.35} L${x - w * 0.15} ${y + w * 1.1} Q${x + w * 0.35} ${y + w * 1.7} ${x + w * 0.8} ${y + w * 1.1} L${x + w * 0.8} ${y + w * 0.3}`}
            fill={TONGUE}
            stroke={INK}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
          <Path d={`M${x + w * 0.32} ${y + w * 0.5} L${x + w * 0.32} ${y + w * 1.05}`} stroke="#DB2777" strokeWidth={1.6} strokeLinecap="round" />
        </G>
      );
    case 'surprised':
      return <Ellipse cx={x} cy={y + w * 0.4} rx={w * 0.45} ry={w * 0.6} fill={MOUTH} stroke={INK} strokeWidth={2.5} />;
    case 'sleepy':
      return <Ellipse cx={x} cy={y + w * 0.3} rx={w * 0.28} ry={w * 0.32} fill={MOUTH} stroke={INK} strokeWidth={2} />;
    case 'sad':
      return <Path d={`M${x - w * 0.85} ${y + w * 0.6} Q${x} ${y - w * 0.35} ${x + w * 0.85} ${y + w * 0.6}`} {...stroke} />;
    case 'grumpy':
      return <Path d={`M${x - w * 0.8} ${y + w * 0.45} Q${x - w * 0.4} ${y} ${x} ${y + w * 0.3} Q${x + w * 0.4} ${y} ${x + w * 0.8} ${y + w * 0.45}`} {...stroke} />;
    case 'love':
    case 'happy':
    default:
      if (catMouth) {
        // the classic cat "w" smile
        return <Path d={`M${x - w} ${y} Q${x - w * 0.5} ${y + w * 0.75} ${x} ${y} Q${x + w * 0.5} ${y + w * 0.75} ${x + w} ${y}`} {...stroke} />;
      }
      return <Path d={`M${x - w} ${y} Q${x} ${y + w * 0.95} ${x + w} ${y}`} {...stroke} />;
  }
}

// ===========================================================================
// The three buddies
// ===========================================================================

function Cat({ color, dark, light, line, style, face }: PartProps) {
  return (
    <G>
      {/* tail (curled up, with a darker tip for stripes) */}
      <OutlinedStroke d="M104 136 Q144 138 140 102 Q138 86 126 90" color={color} line={line} width={9} />
      {style === 'stripes' && <Path d="M134 92 Q131 87 126 90" stroke={dark} strokeWidth={9} strokeLinecap="round" fill="none" />}
      {/* body + belly */}
      <Ellipse cx={80} cy={128} rx={31} ry={25} fill={color} stroke={line} strokeWidth={3} />
      {style === 'patches' ? (
        <G fill={light}>
          <Ellipse cx={92} cy={130} rx={14} ry={11} />
          <Ellipse cx={64} cy={120} rx={8} ry={6} />
        </G>
      ) : (
        <Ellipse cx={80} cy={133} rx={16} ry={13} fill={light} />
      )}
      {style === 'stripes' && (
        <G stroke={dark} strokeWidth={4} strokeLinecap="round">
          <Path d="M54 120 L64 122" />
          <Path d="M53 131 L63 131" />
          <Path d="M106 120 L96 122" />
          <Path d="M107 131 L97 131" />
        </G>
      )}
      <Feet fill={light} line={line} />
      {/* ears */}
      <G stroke={line} strokeWidth={3} strokeLinejoin="round">
        <Path d="M44 56 L40 14 L76 36 Z" fill={color} />
        <Path d="M116 56 L120 14 L84 36 Z" fill={color} />
      </G>
      <Path d="M49 47 L47 26 L66 38 Z" fill="#F9A8D4" />
      <Path d="M111 47 L113 26 L94 38 Z" fill="#F9A8D4" />
      {/* head */}
      <Ellipse cx={80} cy={66} rx={45} ry={40} fill={color} stroke={line} strokeWidth={3} />
      {style === 'patches' && <Ellipse cx={62} cy={58} rx={17} ry={15} fill={light} />}
      {style === 'stripes' && (
        <G stroke={dark} strokeWidth={4} strokeLinecap="round">
          <Path d="M80 28 L80 40" />
          <Path d="M69 30 L71 40" />
          <Path d="M91 30 L89 40" />
        </G>
      )}
      {/* muzzle, nose, whiskers */}
      <Ellipse cx={80} cy={86} rx={15} ry={10} fill={light} opacity={0.75} />
      <Face face={face} eyes={[[62, 64], [98, 64]]} s={10} mouth={[80, 88]} mw={8} line={line} catMouth />
      <Path d="M75 79 Q80 76 85 79 Q82 85 80 85 Q78 85 75 79 Z" fill="#F472B6" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <G stroke={INK} strokeWidth={1.8} strokeLinecap="round" opacity={0.65}>
        <Path d="M56 84 L36 80" />
        <Path d="M56 89 L36 91" />
        <Path d="M104 84 L124 80" />
        <Path d="M104 89 L124 91" />
      </G>
    </G>
  );
}

function Dog({ color, dark, light, line, style, face }: PartProps) {
  const pointy = style === 'pointy';
  return (
    <G>
      {/* wagging tail */}
      <OutlinedStroke d="M106 130 Q134 124 136 100" color={color} line={line} width={9} />
      <G stroke={line} strokeWidth={2} strokeLinecap="round" opacity={0.7}>
        <Path d="M142 98 L148 94" />
        <Path d="M144 106 L151 105" />
      </G>
      {/* body + belly */}
      <Ellipse cx={80} cy={128} rx={31} ry={25} fill={color} stroke={line} strokeWidth={3} />
      <Ellipse cx={80} cy={133} rx={16} ry={13} fill={light} />
      {style === 'spots' && (
        <G fill={dark}>
          <Circle cx={62} cy={122} r={6} />
          <Circle cx={100} cy={132} r={6} />
          <Circle cx={96} cy={114} r={4} />
        </G>
      )}
      <Feet fill={light} line={line} />
      {/* pointy ears (behind the head) */}
      {pointy && (
        <G stroke={line} strokeWidth={3} strokeLinejoin="round">
          <Path d="M46 52 L42 14 L74 34 Z" fill={dark} />
          <Path d="M114 52 L118 14 L86 34 Z" fill={dark} />
          <Path d="M51 44 L49 26 L64 36 Z" fill="#F9A8D4" stroke="none" />
          <Path d="M109 44 L111 26 L96 36 Z" fill="#F9A8D4" stroke="none" />
        </G>
      )}
      {/* head */}
      <Ellipse cx={80} cy={64} rx={44} ry={40} fill={color} stroke={line} strokeWidth={3} />
      {style === 'spots' && <Ellipse cx={98} cy={56} rx={15} ry={14} fill={dark} />}
      {/* floppy ears (in front, at the sides) */}
      {!pointy && (
        <G fill={dark} stroke={line} strokeWidth={3} strokeLinejoin="round">
          <Path d="M48 34 Q26 40 28 78 Q30 98 46 94 Q52 70 56 40 Z" />
          <Path d="M112 34 Q134 40 132 78 Q130 98 114 94 Q108 70 104 40 Z" />
        </G>
      )}
      {/* snout */}
      <Ellipse cx={80} cy={86} rx={20} ry={14} fill={light} stroke={line} strokeWidth={2} />
      <Face face={face} eyes={[[63, 60], [97, 60]]} s={10} mouth={[80, 92]} mw={9} line={line} />
      {/* nose */}
      <Ellipse cx={80} cy={80} rx={8} ry={5.5} fill={INK} />
      <Ellipse cx={77.5} cy={78.5} rx={2.5} ry={1.5} fill="#FFFFFF" opacity={0.8} />
    </G>
  );
}

function Alien({ color, dark, light, line, style, face }: PartProps) {
  const threeEyes = style === 'threeEyes';
  return (
    <G>
      {/* antennae with glowing tips */}
      {style === 'oneAntenna' && (
        <G>
          <Path d="M80 30 Q76 18 80 9" stroke={line} strokeWidth={4} strokeLinecap="round" fill="none" />
          <Circle cx={80} cy={8} r={7} fill="#FDE047" stroke="#CA8A04" strokeWidth={2} />
          <Circle cx={78} cy={6} r={2} fill="#FFFFFF" />
        </G>
      )}
      {style === 'twoAntennae' && (
        <G>
          <Path d="M64 32 Q58 20 52 12" stroke={line} strokeWidth={4} strokeLinecap="round" fill="none" />
          <Path d="M96 32 Q102 20 108 12" stroke={line} strokeWidth={4} strokeLinecap="round" fill="none" />
          <Circle cx={51} cy={10} r={7} fill="#FDE047" stroke="#CA8A04" strokeWidth={2} />
          <Circle cx={109} cy={10} r={7} fill="#FDE047" stroke="#CA8A04" strokeWidth={2} />
          <Circle cx={49} cy={8} r={2} fill="#FFFFFF" />
          <Circle cx={107} cy={8} r={2} fill="#FFFFFF" />
        </G>
      )}
      {/* arms: one down, one waving hello */}
      <OutlinedStroke d="M56 124 Q46 132 42 140" color={color} line={line} width={10} />
      <OutlinedStroke d="M104 122 Q118 116 124 100" color={color} line={line} width={10} />
      {/* body + belly + feet */}
      <Ellipse cx={80} cy={128} rx={27} ry={24} fill={color} stroke={line} strokeWidth={3} />
      <Ellipse cx={80} cy={132} rx={14} ry={11} fill={light} />
      <Feet fill={dark} line={line} y={151} />
      {/* head */}
      <Ellipse cx={80} cy={64} rx={47} ry={38} fill={color} stroke={line} strokeWidth={3} />
      {/* little spots and a shine */}
      <G fill={light} opacity={0.7}>
        <Circle cx={112} cy={50} r={5} />
        <Circle cx={121} cy={62} r={3} />
        <Circle cx={44} cy={78} r={3.5} />
      </G>
      <Ellipse cx={62} cy={40} rx={12} ry={5} fill="#FFFFFF" opacity={0.35} />
      {threeEyes ? (
        <Face face={face} eyes={[[54, 68], [80, 54], [106, 68]]} s={9} mouth={[80, 90]} mw={10} line={line} />
      ) : (
        <Face face={face} eyes={[[60, 64], [100, 64]]} s={13} mouth={[80, 90]} mw={11} line={line} />
      )}
    </G>
  );
}
