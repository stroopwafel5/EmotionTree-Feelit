/**
 * TopBar.tsx
 * --------------------------------------------------------------------------
 * The bar at the top of the new screens (studios, friends, chat):
 * a "back" button on the left, the title, and an optional extra on the right.
 * Always in the same place, so the child always knows how to go back.
 *
 *   <TopBar backLabel="🏠 Home" onBack={goHome} title="My Friends" />
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { fontSizes, fonts, spacing } from '../theme/theme';
import AppText from './AppText';
import KidButton from './KidButton';

interface TopBarProps {
  title: string;
  onBack: () => void;
  /** Text on the back button (default "⬅ Back"). */
  backLabel?: string;
  /** Read by screen readers for the back button. */
  backHint?: string;
  /** Something small on the right (an avatar, a button...). */
  right?: React.ReactNode;
}

export default function TopBar({ title, onBack, backLabel = '⬅ Back', backHint, right }: TopBarProps) {
  return (
    <View style={styles.bar}>
      <KidButton label={backLabel} variant="soft" onPress={onBack} accessibilityLabel={backHint ?? backLabel} />
      <AppText style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
});
