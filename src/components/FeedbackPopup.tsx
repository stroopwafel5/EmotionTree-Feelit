/**
 * FeedbackPopup.tsx
 * --------------------------------------------------------------------------
 * The popup the child sees after answering a question.
 *
 *  Right answer -> green popup:  "Well Done! You did Great!"
 *  Wrong answer -> soft red popup: "Oh no… Let's try this again later!"
 *
 * A right answer also shows the space candies won ("+1 🍬 space candy").
 *
 * The child taps the big button to go on. We do not move on by ourselves:
 * letting the child decide when to continue keeps things calm and
 * predictable.
 */
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';
import AppText from './AppText';
import KidButton from './KidButton';

/** The exact messages from the brief. */
export const RIGHT_MESSAGE = 'Well Done! You did Great!';
export const WRONG_MESSAGE = "Oh no… Let's try this again later!";

interface FeedbackPopupProps {
  visible: boolean;
  /** Was the answer right? */
  correct: boolean;
  /** Is this the last question of the level? (changes the button text) */
  isLastQuestion: boolean;
  /** Called when the child taps the button (or the Android back button). */
  onContinue: () => void;
  /** Space candies won with this answer (0 = don't show). */
  candies?: number;
}

export default function FeedbackPopup({
  visible,
  correct,
  isLastQuestion,
  onContinue,
  candies = 0,
}: FeedbackPopupProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
      statusBarTranslucent>
      <View style={styles.dimmer}>
        <View
          style={[styles.card, correct ? styles.cardRight : styles.cardWrong]}
          accessibilityLiveRegion="assertive"
          accessibilityViewIsModal>
          <AppText style={styles.icon}>{correct ? '🌟' : '💜'}</AppText>
          <AppText style={styles.message}>
            {correct ? RIGHT_MESSAGE : WRONG_MESSAGE}
          </AppText>
          {correct && candies > 0 && (
            <View style={styles.candy}>
              <AppText style={styles.candyText}>
                +{candies} 🍬 space cand{candies === 1 ? 'y' : 'ies'}
              </AppText>
            </View>
          )}
          <KidButton
            label={isLastQuestion ? 'Finish 🏁' : 'Next question ➜'}
            onPress={onContinue}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimmer: {
    flex: 1,
    backgroundColor: 'rgba(10, 4, 30, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 6,
    padding: spacing.lg,
    alignItems: 'center',
  },
  cardRight: {
    borderColor: colors.correct,
  },
  cardWrong: {
    borderColor: colors.wrong,
  },
  icon: {
    fontSize: 64,
    lineHeight: 80,
  },
  message: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * 1.3,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  button: {
    alignSelf: 'stretch',
  },
  candy: {
    backgroundColor: '#FCE7F3',
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  candyText: {
    color: '#9D174D',
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.3,
  },
});
