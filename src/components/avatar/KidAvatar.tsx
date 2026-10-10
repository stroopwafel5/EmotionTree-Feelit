/**
 * KidAvatar.tsx
 * --------------------------------------------------------------------------
 * Draws the child's own avatar from a Look (isHuman = true): hair style and
 * colour, skin colour, outfit, accessories (cat ears, glasses, ...), and a
 * FACE THAT SHOWS THE CHOSEN FEELING (happy, sad, scared, too much, ...).
 *
 * Drawn with simple shapes (react-native-svg) - no picture files, no AI art.
 *
 * Space Shop items (bought with space candies) are drawn here too:
 *   behind the body : super cape, rainbow wings, jetpack
 *   on the body     : pumpkin costume, guitar, fire powers (flames on the hands)
 *   on the head     : witch hat, cool shades
 *
 * Usage:
 *   <KidAvatar look={user.look} feeling="happy" size={160} />          whole body
 *   <KidAvatar look={user.look} feeling="sad" size={56} headOnly />     just the head
 *
 * The drawing is made on a 200 x 290 grid (head centre at 100, 92).
 */
import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

import type { Look } from '../../models/Look';
import { Flame, Guitar, RainbowWing, Spark } from './extras';
import { darker, lighter } from './shade';

interface KidAvatarProps {
  look: Look;
  /** Feeling id from feelings.json ("happy", "sad"...), or null. */
  feeling?: string | null;
  /** Height in pixels (the width follows). */
  size?: number;
  /** Draw only the head (for lists and chat bubbles). */
  headOnly?: boolean;
}

const INK = '#2B1B17'; // eyes, mouth
const BLUSH = '#F472B6';
const PANTS = '#3B2A6B';
const SHOES = '#1E1238';

export default function KidAvatar({
  look,
  feeling = null,
  size = 160,
  headOnly = false,
}: KidAvatarProps) {
  const skin = look.skin.color || '#E9B68B';
  const hair = look.hairColor?.color || '#6B4423';
  const outfit = look.outfit?.color || '#7C3AED';
  const isSpacesuit = look.outfit?.id === 'spacesuit';
  const viewBox = headOnly ? '22 6 156 156' : '0 0 200 290';
  const width = headOnly ? size : (size * 200) / 290;

  return (
    <Svg
      width={width}
      height={size}
      viewBox={viewBox}
      accessible
      accessibilityLabel={`Avatar${feeling ? `, feeling ${feeling}` : ''}`}>
      {/* ---- shop items BEHIND the body (whole avatar only) ---- */}
      {!headOnly && <BehindBody look={look} />}

      {/* ---- behind the head: long hair, buns, ponytail, headphone band ---- */}
      <HairBack style={look.hair.id} color={hair} />

      {/* ---- body ---- */}
      {!headOnly && (
        <G>
          {/* legs + shoes */}
          <Rect x={72} y={232} width={24} height={40} rx={10} fill={PANTS} />
          <Rect x={104} y={232} width={24} height={40} rx={10} fill={PANTS} />
          <Ellipse cx={82} cy={276} rx={17} ry={9} fill={SHOES} />
          <Ellipse cx={118} cy={276} rx={17} ry={9} fill={SHOES} />
          {/* arms (behind the body) + hands */}
          <Path d="M70 166 Q52 190 50 214" stroke={darker(outfit, 0.1)} strokeWidth={20} strokeLinecap="round" fill="none" />
          <Path d="M130 166 Q148 190 150 214" stroke={darker(outfit, 0.1)} strokeWidth={20} strokeLinecap="round" fill="none" />
          <Circle cx={50} cy={220} r={11} fill={skin} />
          <Circle cx={150} cy={220} r={11} fill={skin} />
          {/* neck */}
          <Rect x={90} y={138} width={20} height={20} rx={6} fill={darker(skin, 0.08)} />
          {/* top */}
          <Path
            d="M64 160 Q66 148 82 146 L118 146 Q134 148 136 160 L142 232 Q142 242 132 242 L68 242 Q58 242 58 232 Z"
            fill={outfit}
          />
          {isSpacesuit ? (
            <G>
              <Rect x={70} y={148} width={60} height={12} rx={6} fill="#C4B5FD" />
              <Circle cx={118} cy={186} r={10} fill="#7C3AED" />
              <Polygon points="118,179 120,184 125,184 121,187 123,192 118,189 113,192 115,187 111,184 116,184" fill="#FDE047" />
              <Rect x={74} y={200} width={26} height={8} rx={4} fill="#A5B4FC" />
            </G>
          ) : (
            <G>
              <Path d="M88 146 Q100 160 112 146" fill={darker(skin, 0.05)} />
              <Path d="M60 236 L140 236" stroke={darker(outfit, 0.15)} strokeWidth={4} />
            </G>
          )}
          {/* shop items ON the body */}
          <OnBody look={look} />
        </G>
      )}

      {/* ---- head ---- */}
      <Circle cx={42} cy={98} r={11} fill={darker(skin, 0.06)} />
      <Circle cx={158} cy={98} r={11} fill={darker(skin, 0.06)} />
      <Circle cx={100} cy={92} r={58} fill={skin} />

      {/* ---- face (changes with the feeling) ---- */}
      <Face feeling={feeling} skin={skin} />
      {look.has('freckles') && (
        <G fill="#8B4A2B" opacity={0.55}>
          <Circle cx={70} cy={112} r={1.9} />
          <Circle cx={77} cy={116} r={1.9} />
          <Circle cx={83} cy={111} r={1.9} />
          <Circle cx={117} cy={111} r={1.9} />
          <Circle cx={123} cy={116} r={1.9} />
          <Circle cx={130} cy={112} r={1.9} />
        </G>
      )}

      {/* ---- hair on top of the head ---- */}
      <HairFront style={look.hair.id} color={hair} />

      {/* ---- accessories ---- */}
      {look.has('catEars') && (
        <G>
          <Path d="M52 58 L46 14 L84 40 Z" fill={hair} />
          <Path d="M58 50 L55 27 L74 40 Z" fill="#F9A8D4" />
          <Path d="M148 58 L154 14 L116 40 Z" fill={hair} />
          <Path d="M142 50 L145 27 L126 40 Z" fill="#F9A8D4" />
        </G>
      )}
      {look.has('headphones') && (
        <G>
          <Path d="M42 92 Q40 24 100 24 Q160 24 158 92" stroke="#7C3AED" strokeWidth={9} fill="none" strokeLinecap="round" />
          <Rect x={28} y={80} width={20} height={34} rx={9} fill="#7C3AED" />
          <Rect x={152} y={80} width={20} height={34} rx={9} fill="#7C3AED" />
          <Rect x={33} y={86} width={10} height={22} rx={5} fill="#C4B5FD" />
          <Rect x={157} y={86} width={10} height={22} rx={5} fill="#C4B5FD" />
        </G>
      )}
      {look.has('glasses') && (
        <G stroke="#1F2937" strokeWidth={3.5} fill="#FFFFFF" fillOpacity={0.22}>
          <Circle cx={80} cy={98} r={14} />
          <Circle cx={120} cy={98} r={14} />
          <Path d="M94 96 Q100 91 106 96" fill="none" />
          <Path d="M66 95 L45 91" fill="none" />
          <Path d="M134 95 L155 91" fill="none" />
        </G>
      )}
      {look.has('bow') && (
        <G>
          <Path d="M140 42 L120 30 L122 56 Z" fill="#EC4899" />
          <Path d="M140 42 L160 30 L158 56 Z" fill="#EC4899" />
          <Circle cx={140} cy={43} r={6.5} fill="#BE185D" />
        </G>
      )}
      {look.has('starClip') && (
        <Polygon
          points="62,40 66,50 77,50 68,57 71,68 62,61 53,68 56,57 47,50 58,50"
          fill="#FACC15"
          stroke="#CA8A04"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}

      {/* ---- shop items on the head ---- */}
      {look.has('witchHat') && (
        <G stroke="#2E1065" strokeWidth={2} strokeLinejoin="round">
          <Path d="M68 36 L94 6 Q102 -2 108 6 L132 36 Z" fill="#5B21B6" />
          <Path d="M70 29 L130 29 L133 37 L67 37 Z" fill="#F97316" stroke="#C2410C" />
          <Rect x={95} y={28} width={10} height={10} rx={2} fill="#FDE047" stroke="#A16207" />
          <Path d="M38 40 Q100 24 162 40 Q100 52 38 40 Z" fill="#4C1D95" />
        </G>
      )}
      {look.has('coolShades') && (
        <G>
          <G stroke="#000000" strokeWidth={3} fill="none" strokeLinecap="round">
            <Path d="M94 95 Q100 90 106 95" />
            <Path d="M64 95 L44 91" />
            <Path d="M136 95 L156 91" />
          </G>
          <Rect x={63} y={86} width={32} height={22} rx={8} fill="#111827" stroke="#000000" strokeWidth={2} />
          <Rect x={105} y={86} width={32} height={22} rx={8} fill="#111827" stroke="#000000" strokeWidth={2} />
          <G stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" opacity={0.6}>
            <Path d="M70 91 L77 99" />
            <Path d="M112 91 L119 99" />
          </G>
        </G>
      )}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Space Shop items around the body
// ---------------------------------------------------------------------------

/** Drawn first, so the body covers part of them. */
function BehindBody({ look }: { look: Look }) {
  return (
    <G>
      {look.has('superCape') && (
        <G>
          <Path d="M66 152 Q100 142 134 152 Q156 200 176 268 Q100 286 24 268 Q44 200 66 152 Z" fill="#DC2626" stroke="#991B1B" strokeWidth={2.5} strokeLinejoin="round" />
          <G stroke="#B91C1C" strokeWidth={3} strokeLinecap="round">
            <Path d="M74 170 L48 266" />
            <Path d="M126 170 L152 266" />
          </G>
        </G>
      )}
      {look.has('rainbowWings') && (
        <G>
          <RainbowWing x={72} y={170} size={0.85} />
          <RainbowWing x={128} y={170} size={0.85} flip />
        </G>
      )}
      {look.has('jetpack') && (
        <G>
          {[50, 150].map(cx => (
            <G key={cx}>
              {/* flames out of the bottom */}
              <G transform={`rotate(180 ${cx} 224)`}>
                <Flame x={cx} y={224} size={0.5} />
              </G>
              <Rect x={cx - 8} y={210} width={16} height={14} rx={3} fill="#475569" />
              <Rect x={cx - 12} y={150} width={24} height={66} rx={11} fill="#CBD5E1" stroke="#64748B" strokeWidth={2.5} />
              <Path d={`M${cx - 12} 162 Q${cx} 134 ${cx + 12} 162 Z`} fill="#EF4444" stroke="#991B1B" strokeWidth={2} strokeLinejoin="round" />
              <Rect x={cx - 12} y={192} width={24} height={6} fill="#94A3B8" />
            </G>
          ))}
        </G>
      )}
    </G>
  );
}

/** Drawn over the body (after the top / T-shirt). */
function OnBody({ look }: { look: Look }) {
  return (
    <G>
      {look.has('pumpkinCostume') && (
        <G>
          <Path
            d="M60 168 Q58 146 82 146 L118 146 Q142 146 140 168 Q152 204 140 236 Q134 246 100 246 Q66 246 60 236 Q48 204 60 168 Z"
            fill="#F97316"
            stroke="#C2410C"
            strokeWidth={2.5}
          />
          <G stroke="#EA580C" strokeWidth={3} fill="none" strokeLinecap="round">
            <Path d="M80 150 Q72 196 80 242" />
            <Path d="M120 150 Q128 196 120 242" />
          </G>
          {/* jack-o'-lantern face */}
          <G fill="#3B1D0E">
            <Polygon points="78,186 90,186 84,174" />
            <Polygon points="110,186 122,186 116,174" />
            <Polygon points="96,198 104,198 100,190" />
            <Path d="M76 208 L84 216 L92 208 L100 216 L108 208 L116 216 L124 208 Q100 234 76 208 Z" />
          </G>
          {/* green leaf collar */}
          <Path d="M84 146 Q92 156 100 148 Q108 156 116 146 Q100 140 84 146 Z" fill="#16A34A" stroke="#14532D" strokeWidth={1.5} />
        </G>
      )}
      {look.has('superCape') && (
        <G stroke="#991B1B" strokeWidth={1.5} strokeLinejoin="round">
          <Path d="M66 152 L86 148 L78 166 Z" fill="#DC2626" />
          <Path d="M134 152 L114 148 L122 166 Z" fill="#DC2626" />
          <Circle cx={100} cy={152} r={5} fill="#FACC15" stroke="#A16207" />
        </G>
      )}
      {look.has('guitar') && <Guitar x={112} y={210} size={0.75} />}
      {look.has('firePowers') && (
        <G>
          <Flame x={50} y={214} size={0.6} />
          <Flame x={150} y={214} size={0.6} flip />
          <Spark x={34} y={186} />
          <Spark x={64} y={172} r={2} />
          <Spark x={138} y={176} r={2} />
          <Spark x={166} y={190} />
        </G>
      )}
    </G>
  );
}

// ---------------------------------------------------------------------------
// Hair: a back part (behind the head) and a front part (over the forehead)
// ---------------------------------------------------------------------------

function HairBack({ style, color }: { style: string; color: string }) {
  const dark = darker(color, 0.15);
  switch (style) {
    case 'long':
      return <Path d="M38 92 Q34 26 100 24 Q166 26 162 92 L166 176 Q134 188 100 184 Q66 188 34 176 Z" fill={dark} />;
    case 'ponytail':
      return (
        <G>
          <Path d="M146 64 Q190 70 182 130 Q178 156 160 168 Q170 130 152 96 Z" fill={dark} />
          <Circle cx={150} cy={66} r={8} fill="#EC4899" />
        </G>
      );
    case 'buns':
      return (
        <G>
          <Circle cx={56} cy={38} r={24} fill={dark} />
          <Circle cx={144} cy={38} r={24} fill={dark} />
          <Path d="M44 30 Q56 22 66 32" stroke={lighter(color, 0.25)} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Path d="M132 30 Q144 22 154 32" stroke={lighter(color, 0.25)} strokeWidth={3} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'curly':
      return (
        <G fill={dark}>
          {[
            [44, 112], [40, 88], [44, 64], [156, 112], [160, 88], [156, 64],
          ].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={17} />
          ))}
        </G>
      );
    default:
      return null;
  }
}

function HairFront({ style, color }: { style: string; color: string }) {
  const shine = lighter(color, 0.25);
  switch (style) {
    case 'short':
      return (
        <G>
          <Path d="M42 92 Q38 32 100 30 Q162 32 158 92 Q152 70 134 60 Q116 70 96 62 Q74 72 54 70 Q44 78 42 92 Z" fill={color} />
          <Path d="M70 44 Q90 36 110 40" stroke={shine} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'long':
      return (
        <G>
          <Path d="M42 100 Q36 30 100 28 Q164 30 158 100 Q154 72 138 56 Q112 68 86 54 Q62 62 48 82 Z" fill={color} />
          <Path d="M43 84 Q36 124 44 160 L56 160 Q50 124 54 90 Z" fill={color} />
          <Path d="M157 84 Q164 124 156 160 L144 160 Q150 124 146 90 Z" fill={color} />
          <Path d="M72 42 Q92 34 112 38" stroke={shine} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'curly':
      return (
        <G fill={color}>
          {[
            [52, 62], [66, 46], [84, 38], [102, 34], [120, 38], [137, 46], [150, 62],
            [62, 64], [80, 56], [100, 52], [120, 56], [138, 64],
          ].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={15} />
          ))}
        </G>
      );
    case 'ponytail':
      return (
        <G>
          <Path d="M42 92 Q38 32 100 30 Q162 32 158 92 Q150 64 128 54 Q100 64 72 58 Q52 66 42 92 Z" fill={color} />
          <Path d="M74 44 Q94 36 114 40" stroke={shine} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'buns':
      return (
        <G>
          <Path d="M42 92 Q38 34 100 32 Q162 34 158 92 Q148 66 124 62 Q100 54 76 62 Q52 66 42 92 Z" fill={color} />
          <Path d="M100 33 L100 56" stroke={darker(color, 0.15)} strokeWidth={3} strokeLinecap="round" />
        </G>
      );
    case 'spiky':
      return (
        <Path
          d="M42 92 Q38 52 54 40 L54 18 L72 34 L82 10 L96 30 L108 8 L118 30 L134 12 L138 36 L154 26 L150 50 Q162 64 158 92 Q148 70 126 64 Q104 72 84 64 Q62 72 50 76 Z"
          fill={color}
        />
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Faces: one for each feeling in feelings.json
// ---------------------------------------------------------------------------

function Face({ feeling, skin }: { feeling: string | null; skin: string }) {
  const eye = (x: number, y = 98, ry = 8) => (
    <G key={`e${x}`}>
      <Ellipse cx={x} cy={y} rx={6} ry={ry} fill={INK} />
      <Circle cx={x + 2} cy={y - 3} r={2.2} fill="#FFFFFF" />
    </G>
  );
  const blush = (
    <G fill={BLUSH} opacity={0.35}>
      <Ellipse cx={70} cy={114} rx={8} ry={4.5} />
      <Ellipse cx={130} cy={114} rx={8} ry={4.5} />
    </G>
  );
  const line = (d: string, width = 4) => (
    <Path d={d} stroke={INK} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  );

  switch (feeling) {
    case 'excited':
      return (
        <G>
          {eye(80, 96, 9)}
          {eye(120, 96, 9)}
          <Path d="M82 114 Q100 142 118 114 Z" fill={INK} />
          <Path d="M90 128 Q100 136 110 128 Q100 124 90 128 Z" fill="#F472B6" />
          {blush}
          <Polygon points="34,42 37,50 45,50 39,55 41,63 34,58 27,63 29,55 23,50 31,50" fill="#FDE047" />
          <Polygon points="170,30 172,36 178,36 173,40 175,46 170,42 165,46 167,40 162,36 168,36" fill="#FDE047" />
        </G>
      );
    case 'calm':
      return (
        <G>
          {line('M72 100 Q80 94 88 100', 3.5)}
          {line('M112 100 Q120 94 128 100', 3.5)}
          {line('M90 120 Q100 127 110 120', 3.5)}
          {blush}
        </G>
      );
    case 'tired':
      return (
        <G>
          {line('M72 98 Q80 104 88 98', 3.5)}
          {line('M112 98 Q120 104 128 98', 3.5)}
          <Ellipse cx={100} cy={124} rx={6} ry={8} fill={INK} />
          {line('M150 36 L162 36 L150 48 L162 48', 3)}
          {line('M166 18 L174 18 L166 26 L174 26', 2.5)}
        </G>
      );
    case 'sad':
      return (
        <G>
          {line('M70 84 L88 78', 3.5)}
          {line('M112 78 L130 84', 3.5)}
          {eye(80, 100)}
          {eye(120, 100)}
          {line('M86 128 Q100 116 114 128')}
          <Path d="M124 108 Q118 118 124 122 Q130 118 124 108 Z" fill="#60A5FA" />
        </G>
      );
    case 'scared':
      return (
        <G>
          {line('M70 76 Q79 70 88 76', 3.5)}
          {line('M112 76 Q121 70 130 76', 3.5)}
          <Circle cx={80} cy={98} r={10} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
          <Circle cx={120} cy={98} r={10} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
          <Circle cx={80} cy={99} r={4.5} fill={INK} />
          <Circle cx={120} cy={99} r={4.5} fill={INK} />
          <Ellipse cx={100} cy={126} rx={7} ry={9} fill={INK} />
          <Path d="M150 70 Q144 80 150 84 Q156 80 150 70 Z" fill="#93C5FD" />
        </G>
      );
    case 'angry':
      return (
        <G>
          {line('M68 80 L90 88', 4.5)}
          {line('M110 88 L132 80', 4.5)}
          {eye(80, 100, 7)}
          {eye(120, 100, 7)}
          {line('M86 126 Q100 116 114 126')}
          <G fill="#EF4444" opacity={0.25}>
            <Ellipse cx={70} cy={114} rx={9} ry={5} />
            <Ellipse cx={130} cy={114} rx={9} ry={5} />
          </G>
        </G>
      );
    case 'annoyed':
      return (
        <G>
          {eye(80, 100, 7)}
          {eye(120, 100, 7)}
          {/* heavy eyelids */}
          <Path d="M72 93 L88 93 L88 99 L72 99 Z" fill={skin} />
          <Path d="M112 93 L128 93 L128 99 L112 99 Z" fill={skin} />
          {line('M72 96 L88 96', 3)}
          {line('M112 96 L128 96', 3)}
          {line('M110 80 Q120 74 130 80', 3)}
          {line('M88 122 L114 119', 3.5)}
        </G>
      );
    case 'jealous':
      return (
        <G>
          {line('M70 84 L88 82', 3)}
          {line('M112 82 L130 84', 3)}
          <Ellipse cx={80} cy={98} rx={8} ry={8} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
          <Ellipse cx={120} cy={98} rx={8} ry={8} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
          <Circle cx={84} cy={99} r={4} fill={INK} />
          <Circle cx={124} cy={99} r={4} fill={INK} />
          {line('M86 124 Q93 119 100 124 Q107 129 114 124', 3.5)}
        </G>
      );
    case 'overwhelmed':
      return (
        <G>
          {line('M72 91 L86 98 L72 105', 3.5)}
          {line('M128 91 L114 98 L128 105', 3.5)}
          {line('M86 126 Q93 120 100 126 Q107 132 114 126', 3.5)}
          {/* "too much" waves next to the ears */}
          {line('M24 80 Q18 88 24 96 Q30 104 24 112', 3)}
          {line('M176 80 Q182 88 176 96 Q170 104 176 112', 3)}
          <Path d="M152 66 Q146 76 152 80 Q158 76 152 66 Z" fill="#93C5FD" />
        </G>
      );
    case 'happy':
    default:
      return (
        <G>
          {eye(80)}
          {eye(120)}
          {line('M84 116 Q100 134 116 116')}
          {blush}
        </G>
      );
  }
}
