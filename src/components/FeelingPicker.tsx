/**
 * FeelingPicker.tsx
 * --------------------------------------------------------------------------
 * "How do you feel right now?" - a popup with a big button for every
 * feeling in feelings.json. Used on the home screen (the avatar's thought
 * bubble). The chat uses the same feelings to send feeling cards.
 */
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { feelings } from '../services/feelings';
import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';
import AppText from './AppText';
import KidButton from './KidButton';

interface FeelingPickerProps {
  visible: boolean;
  current: string | null;
  onPick: (feelingId: string | null) => void;
  onClose: () => void;
}

export default function FeelingPicker({ visible, current, onPick, onClose }: FeelingPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.dimmer}>
        <View style={styles.card}>
          <AppText style={styles.title}>How do you feel right now?</AppText>
          <AppText style={styles.hint}>Your friends will see it on your avatar.</AppText>
          <ScrollView contentContainerStyle={styles.grid}>
            {feelings.map(f => (
              <FeelingButton
                key={f.id}
                emoji={f.emoji}
                name={f.name}
                selected={current === f.id}
                onPress={() => onPick(f.id)}
              />
            ))}
          </ScrollView>
          <View style={styles.row}>
            {current && (
              <KidButton label="Clear" variant="soft" onPress={() => onPick(null)} style={styles.clear} />
            )}
            <KidButton label="Close" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** One big feeling button (also used in the chat). */
export function FeelingButton({
  emoji,
  name,
  selected = false,
  onPress,
}: {
  emoji: string;
  name: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.feeling, selected && styles.feelingSelected, pressed && styles.pressed]}>
      <AppText style={styles.emoji}>{emoji}</AppText>
      <AppText style={styles.name}>{name}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dimmer: {
    flex: 1,
    backgroundColor: 'rgba(10, 4, 30, 0.75)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: colors.purpleGlow,
    padding: spacing.md,
    maxHeight: '92%',
    gap: spacing.sm,
  },
  title: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
    textAlign: 'center',
  },
  hint: {
    color: colors.textDark,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  feeling: {
    width: 96,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: '#E4D4FB',
    paddingVertical: spacing.sm,
  },
  feelingSelected: {
    borderColor: colors.purpleBright,
    backgroundColor: '#EDE3FF',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  emoji: {
    fontSize: 36,
    lineHeight: 46,
  },
  name: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  clear: {
    // white text needs a dark fill on this light card
    backgroundColor: colors.leafNext,
  },
});
