/**
 * ShowGrownUpCard.tsx
 * --------------------------------------------------------------------------
 * A big, simple card the child can SHOW to a grown-up when words are hard:
 *
 *        💜
 *   I need to talk to you about something important.
 *   Can you help me, please?
 *   (Show this to a grown-up you trust.)
 *
 * The buddy offers it after a worrying message. It works without internet
 * and without Friends. The texts are in buddy.json ("safetyTexts").
 */
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { BUDDY } from '../../models/BuddyBrain';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';
import AppText from '../AppText';
import KidButton from '../KidButton';

export default function ShowGrownUpCard({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const card = BUDDY.safetyTexts.showCard;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.dimmer}>
        <View style={styles.card} accessible accessibilityLabel={`${card.title} ${card.line}`}>
          <AppText style={styles.heart}>💜</AppText>
          <AppText style={styles.title}>{card.title}</AppText>
          <AppText style={styles.line}>{card.line}</AppText>
          <AppText style={styles.small}>{card.small}</AppText>
          <KidButton label="Close" onPress={onClose} style={styles.button} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimmer: {
    flex: 1,
    backgroundColor: 'rgba(10, 4, 30, 0.85)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 6,
    borderColor: colors.purpleGlow,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  heart: {
    fontSize: 72,
    lineHeight: 90,
  },
  title: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * 1.3,
    textAlign: 'center',
  },
  line: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.35,
    textAlign: 'center',
  },
  small: {
    color: '#6B5A8E',
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
