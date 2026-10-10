/**
 * AddFriendModal.tsx
 * --------------------------------------------------------------------------
 * "Add a friend" with the friend's code, in two easy steps - no spelling:
 *
 *   1. Pick the space word (big picture buttons: ⭐ STAR, 🌙 MOON, ...)
 *   2. Tap the 4 numbers on a big number pad
 *
 * Then the request goes to the server, which emails BOTH parents.
 * The friend only sees the request after both parents said yes.
 */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../../components/AppText';
import KidButton from '../../components/KidButton';
import { ApiError } from '../../services/api';
import { CODE_WORDS, makeCode } from '../../services/friendCode';
import { friendsService } from '../../services/friendsService';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';

interface AddFriendModalProps {
  visible: boolean;
  token: string;
  onClose: () => void;
  /** A request was sent (so the list can refresh). */
  onSent: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0'];

export default function AddFriendModal({ visible, token, onClose, onSent }: AddFriendModalProps) {
  const [word, setWord] = useState<string | null>(null);
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Start fresh each time it opens.
  useEffect(() => {
    if (visible) {
      setWord(null);
      setDigits('');
      setError(null);
      setSentTo(null);
    }
  }, [visible]);

  const press = (key: string) => {
    setError(null);
    if (key === '⌫') {
      setDigits(d => d.slice(0, -1));
    } else {
      setDigits(d => (d.length < 4 ? d + key : d));
    }
  };

  const send = async () => {
    if (!word || digits.length !== 4) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await friendsService.requestFriend(token, makeCode(word, digits));
      setSentTo(result.request.to.username);
      onSent();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const picked = CODE_WORDS.find(w => w.word === word);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.dimmer}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.content}>
            {sentTo ? (
              // ---- Done ----
              <>
                <AppText style={styles.bigIcon}>📧</AppText>
                <AppText style={styles.title}>Request sent!</AppText>
                <AppText style={styles.text}>
                  We emailed your grown-up and {sentTo}'s grown-up. When they both say yes, {sentTo} can say yes too.
                </AppText>
                <KidButton label="OK" onPress={onClose} />
              </>
            ) : !word ? (
              // ---- Step 1: the word ----
              <>
                <AppText style={styles.title}>Add a friend</AppText>
                <AppText style={styles.text}>1. Which word is in your friend's code?</AppText>
                <View style={styles.words}>
                  {CODE_WORDS.map(w => (
                    <Pressable
                      key={w.word}
                      onPress={() => setWord(w.word)}
                      accessibilityRole="button"
                      accessibilityLabel={w.word}
                      style={({ pressed }) => [styles.word, pressed && styles.pressed]}>
                      <AppText style={styles.wordIcon}>{w.icon}</AppText>
                      <AppText style={styles.wordText}>{w.word}</AppText>
                    </Pressable>
                  ))}
                </View>
                <KidButton label="Cancel" variant="soft" onPress={onClose} style={styles.soft} />
              </>
            ) : (
              // ---- Step 2: the numbers ----
              <>
                <AppText style={styles.title}>Add a friend</AppText>
                <AppText style={styles.text}>2. Tap the 4 numbers.</AppText>
                <View style={styles.codeRow} accessibilityLabel={`Code: ${word} ${digits}`}>
                  <AppText style={styles.codeWord}>
                    {picked?.icon} {word} -
                  </AppText>
                  {[0, 1, 2, 3].map(i => (
                    <View key={i} style={[styles.digitBox, i === digits.length && styles.digitBoxNext]}>
                      <AppText style={styles.digit}>{digits[i] ?? ''}</AppText>
                    </View>
                  ))}
                </View>
                <View style={styles.pad}>
                  {KEYS.map(key => (
                    <Pressable
                      key={key}
                      onPress={() => press(key)}
                      accessibilityRole="button"
                      accessibilityLabel={key === '⌫' ? 'Delete' : key}
                      style={({ pressed }) => [styles.key, pressed && styles.pressed]}>
                      <AppText style={styles.keyText}>{key}</AppText>
                    </Pressable>
                  ))}
                </View>
                {error ? (
                  <AppText style={styles.error} accessibilityLiveRegion="polite">
                    {error}
                  </AppText>
                ) : null}
                <KidButton
                  label={busy ? 'Sending…' : 'Send friend request'}
                  onPress={send}
                  disabled={busy || digits.length !== 4}
                />
                <KidButton label="⬅ Change the word" variant="soft" onPress={() => setWord(null)} style={styles.soft} />
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    maxHeight: '94%',
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  bigIcon: {
    fontSize: 56,
    lineHeight: 70,
    textAlign: 'center',
  },
  title: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
    textAlign: 'center',
  },
  text: {
    color: colors.textDark,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.4,
    textAlign: 'center',
  },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  word: {
    width: 96,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#E4D4FB',
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
  },
  wordIcon: {
    fontSize: 32,
    lineHeight: 42,
  },
  wordText: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.small - 1,
    lineHeight: (fontSizes.small - 1) * 1.4,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  codeWord: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.3,
  },
  digitBox: {
    width: 40,
    height: 52,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#D8C4FA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxNext: {
    borderColor: colors.purpleBright,
  },
  digit: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    width: 3 * 76 + 2 * spacing.sm,
  },
  key: {
    width: 76,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.purpleBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: colors.textLight,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  error: {
    color: colors.wrong,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'center',
  },
  soft: {
    backgroundColor: colors.leafNext,
  },
});
