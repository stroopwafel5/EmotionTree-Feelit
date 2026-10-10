/**
 * PinPad.tsx
 * --------------------------------------------------------------------------
 * A big number pad for the 4-number grown-up PIN: 4 dots that fill up, and
 * keys 1-9, 0 and ⌫. When 4 numbers are typed, onComplete(pin) is called.
 * Give it a new `key` to clear it.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';
import AppText from './AppText';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0'];

interface PinPadProps {
  title: string;
  hint?: string;
  error?: string | null;
  busy?: boolean;
  onComplete: (pin: string) => void;
}

export default function PinPad({ title, hint, error, busy = false, onComplete }: PinPadProps) {
  const [digits, setDigits] = useState('');

  const press = (key: string) => {
    if (busy) {
      return;
    }
    if (key === '⌫') {
      setDigits(d => d.slice(0, -1));
      return;
    }
    if (digits.length >= 4) {
      return;
    }
    const next = digits + key;
    setDigits(next);
    if (next.length === 4) {
      onComplete(next);
      setDigits('');
    }
  };

  return (
    <View style={styles.box}>
      <AppText style={styles.title}>{title}</AppText>
      {hint ? <AppText style={styles.hint}>{hint}</AppText> : null}
      <View style={styles.dots} accessible accessibilityLabel={`${digits.length} of 4 numbers typed`}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.dot, i < digits.length && styles.dotFull]} />
        ))}
      </View>
      {error ? (
        <AppText style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
      <View style={styles.pad}>
        {KEYS.map(key => (
          <Pressable
            key={key}
            onPress={() => press(key)}
            accessibilityRole="button"
            accessibilityLabel={key === '⌫' ? 'Delete' : `PIN ${key}`}
            style={({ pressed }) => [styles.key, pressed && styles.pressed]}>
            <AppText style={styles.keyText}>{key}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
    textAlign: 'center',
  },
  hint: {
    color: colors.textSoft,
    textAlign: 'center',
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
  },
  dotFull: {
    backgroundColor: colors.purpleGlow,
  },
  error: {
    color: '#FCA5A5',
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    width: 3 * 84 + 2 * spacing.sm,
  },
  key: {
    width: 84,
    height: 68,
    borderRadius: radius.md,
    backgroundColor: colors.purpleBright,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  keyText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
});
