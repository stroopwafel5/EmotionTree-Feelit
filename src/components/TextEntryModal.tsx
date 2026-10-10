/**
 * TextEntryModal.tsx
 * --------------------------------------------------------------------------
 * A popup card with ONE text box, shown near the TOP of the screen so the
 * phone keyboard never covers it. Used for:
 *   - typing a chat message (when the parents allow typing)
 *   - giving the space buddy a name
 *
 * Optional "suggestions" are big buttons that fill the box with one tap
 * (helpful for children who find typing hard).
 */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';
import AppText from './AppText';
import KidButton from './KidButton';

interface TextEntryModalProps {
  visible: boolean;
  title: string;
  /** Text already in the box when the popup opens. */
  initialValue?: string;
  placeholder?: string;
  maxLength?: number;
  /** Label of the main button ("Send", "OK"). */
  doneLabel: string;
  /** Called with the typed text. */
  onDone: (text: string) => void;
  onCancel: () => void;
  /** A problem to show under the box (e.g. "Names can have 1-16 letters"). */
  error?: string | null;
  /** Big buttons that fill the box. */
  suggestions?: string[];
  /** Turns the main button off while something is being sent. */
  busy?: boolean;
}

export default function TextEntryModal({
  visible,
  title,
  initialValue = '',
  placeholder,
  maxLength = 200,
  doneLabel,
  onDone,
  onCancel,
  error,
  suggestions,
  busy = false,
}: TextEntryModalProps) {
  const [value, setValue] = useState(initialValue);

  // Start with the right text every time the popup opens.
  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [visible, initialValue]);

  const done = () => {
    if (value.trim() && !busy) {
      onDone(value.trim());
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.dimmer}>
        <View style={styles.card}>
          <AppText style={styles.title}>{title}</AppText>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor="#8B7BB0"
            maxLength={maxLength}
            autoFocus
            accessibilityLabel={title}
            onSubmitEditing={done}
            returnKeyType="done"
            style={styles.input}
          />
          <AppText style={styles.count}>
            {value.length} / {maxLength}
          </AppText>
          {error ? (
            <AppText style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
          {suggestions && suggestions.length > 0 && (
            <View style={styles.suggestions}>
              {suggestions.map(s => (
                <Pressable
                  key={s}
                  onPress={() => setValue(s)}
                  accessibilityRole="button"
                  accessibilityLabel={s}
                  style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                  <AppText style={styles.chipText}>{s}</AppText>
                </Pressable>
              ))}
            </View>
          )}
          <View style={styles.row}>
            <KidButton label="Cancel" variant="soft" onPress={onCancel} style={styles.cancel} />
            <KidButton label={doneLabel} onPress={done} disabled={!value.trim() || busy} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimmer: {
    flex: 1,
    backgroundColor: 'rgba(10, 4, 30, 0.75)',
    // Near the top: the keyboard comes up from the bottom.
    justifyContent: 'flex-start',
    paddingTop: 56,
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: colors.purpleGlow,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 60,
    color: colors.textDark,
    fontFamily: fonts.regular,
    fontSize: fontSizes.body,
  },
  count: {
    color: '#6B5B95',
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.4,
    textAlign: 'right',
  },
  error: {
    color: colors.wrong,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D8C4FA',
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipText: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancel: {
    // The soft button is made for the dark background; on the light card it
    // needs a dark label, so it gets a filled lavender look instead.
    backgroundColor: colors.leafNext,
  },
});
