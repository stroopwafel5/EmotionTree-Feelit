/**
 * SpaceBackground.tsx
 * --------------------------------------------------------------------------
 * The night-sky background behind every screen: deep purple with stars,
 * a ringed planet and a moon.
 *
 * Calm on purpose:
 *  - The stars do NOT move or twinkle. Moving or flashing things can be
 *    distracting or upsetting for some autistic children.
 *  - The star positions are fixed (not random), so the sky looks exactly the
 *    same every time. Predictable = comfortable.
 *
 * Usage: wrap a screen in it.
 *   <SpaceBackground> ...screen... </SpaceBackground>
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/theme';
import AppText from './AppText';

/**
 * Fixed star positions, as percentages of the screen: [left, top, size].
 * Made by hand so they spread nicely across the sky.
 */
const STARS: Array<[number, number, number]> = [
  [5, 4, 3], [18, 9, 2], [33, 3, 4], [47, 11, 2], [62, 6, 3], [78, 2, 2],
  [91, 10, 4], [9, 19, 2], [26, 23, 3], [55, 21, 2], [70, 17, 3], [86, 25, 2],
  [3, 34, 4], [40, 31, 2], [95, 38, 3], [15, 45, 2], [60, 42, 3], [80, 49, 2],
  [30, 55, 3], [7, 62, 2], [50, 60, 2], [92, 63, 4], [20, 72, 3], [66, 70, 2],
  [83, 77, 3], [4, 84, 2], [38, 82, 4], [57, 88, 2], [74, 93, 3], [13, 95, 2],
  [45, 97, 3], [97, 89, 2],
];

export default function SpaceBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sky}>
      {/* The stars and planets are only decoration, so screen readers skip them. */}
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden>
        {STARS.map(([left, top, size], index) => (
          <View
            key={index}
            style={[
              styles.star,
              {
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                borderRadius: size / 2,
                opacity: size > 2 ? 0.9 : 0.6,
              },
            ]}
          />
        ))}
        <AppText style={[styles.decoration, styles.planet]}>🪐</AppText>
        <AppText style={[styles.decoration, styles.moon]}>🌙</AppText>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sky: {
    flex: 1,
    backgroundColor: colors.space,
  },
  star: {
    position: 'absolute',
    backgroundColor: colors.star,
  },
  decoration: {
    position: 'absolute',
    // Very faint, so they never compete with text in front of them.
    opacity: 0.2,
    fontSize: 64,
    lineHeight: 80,
  },
  planet: {
    right: 12,
    top: '30%',
  },
  moon: {
    left: 10,
    bottom: '12%',
    fontSize: 48,
    lineHeight: 60,
  },
});
