/**
 * CandyCounter.tsx
 * --------------------------------------------------------------------------
 * A small pill showing how many space candies the child has: "🍬 42".
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { fontSizes, fonts, radius, spacing } from '../../theme/theme';
import AppText from '../AppText';

export default function CandyCounter({ candies }: { candies: number }) {
  return (
    <View style={styles.pill} accessible accessibilityLabel={`${candies} space candies`}>
      <AppText style={styles.text}>🍬 {candies}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE7F3',
    borderRadius: radius.round,
    borderWidth: 3,
    borderColor: '#F472B6',
    paddingHorizontal: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  text: {
    color: '#9D174D',
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.3,
  },
});

