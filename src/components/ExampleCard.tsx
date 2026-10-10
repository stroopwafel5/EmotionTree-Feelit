/**
 * ExampleCard.tsx
 * --------------------------------------------------------------------------
 * One short story in the lesson, with the character's picture (an emoji):
 *
 *   ( 👧 )  Dina
 *           Dina really likes playing ball ⚽. Playing makes her happy!
 *
 * The characters are kids (Dina, Jim, ...) and friendly space characters
 * (Zib the alien 👽, Robo the robot 🤖, Luna the space cat 🐱,
 * Captain Kai 🧑‍🚀). They are drawn with emoji, so no AI art is used.
 *
 * The stories come from "examples" in src/data/explanations.json.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { Example } from '../models/Explanation';
import { colors, fontSizes, fonts, spacing } from '../theme/theme';
import AppText from './AppText';

/** Size of the round picture. */
const AVATAR_SIZE = 60;

export default function ExampleCard({ example }: { example: Example }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${example.name}: ${example.text}`}>
      <View style={styles.avatar}>
        <AppText style={styles.avatarIcon}>{example.icon}</AppText>
      </View>
      <View style={styles.words}>
        <AppText style={styles.name}>{example.name}</AppText>
        <AppText style={styles.text}>{example.text}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.spacePanel,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 30,
    lineHeight: 38,
  },
  words: {
    flex: 1,
  },
  name: {
    color: colors.purpleBright,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.35,
  },
  text: {
    color: colors.textDark,
  },
});
