/**
 * PathDots.tsx
 * --------------------------------------------------------------------------
 * The little dots that join two leaves on the tree path.
 *
 * The dots slide from the position of the leaf above (`fromOffset`) to the
 * position of the leaf below (`toOffset`), so the path zig-zags smoothly.
 * MyTree.draw() picks the colour: a rainbow colour when the leaf above is
 * finished, grey when it is not.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../theme/theme';

interface PathDotsProps {
  fromOffset: number;
  toOffset: number;
  color: string;
}

/** How many dots between two leaves. */
const DOT_COUNT = 3;

export default function PathDots({
  fromOffset,
  toOffset,
  color,
}: PathDotsProps) {
  return (
    <View style={styles.column} pointerEvents="none">
      {Array.from({ length: DOT_COUNT }, (_, i) => {
        // How far along the way from the top leaf to the bottom leaf (0..1).
        const progress = (i + 1) / (DOT_COUNT + 1);
        const x = fromOffset + (toOffset - fromOffset) * progress;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: color, transform: [{ translateX: x }] },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginVertical: 6,
  },
});
