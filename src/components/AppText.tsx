/**
 * AppText.tsx
 * --------------------------------------------------------------------------
 * The one Text component the whole app uses.
 *
 * It sets the friendly, easy-to-read Lexend font and a big default size, so
 * no screen can forget them. Any style you pass in is added on top.
 *
 * Usage:
 *   <AppText>Hello!</AppText>
 *   <AppText style={{ color: 'red' }}>Big red hello</AppText>
 */
import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fontSizes, fonts } from '../theme/theme';

export default function AppText({ style, ...rest }: TextProps) {
  // `style` comes last, so screens can change the colour, size or font file.
  return <Text {...rest} style={[styles.base, style]} />;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.body,
    // Extra line height = more space between lines = easier reading.
    lineHeight: fontSizes.body * 1.45,
    color: colors.textLight,
  },
});
