/**
 * QuizQuestion.tsx
 * --------------------------------------------------------------------------
 * ONE quiz question, Kahoot style, used by the leaves (LevelPlayer) and by
 * the Feelings Test (TestScreen):
 *
 *   - "Question 2 of 8" + one dot per question
 *   - a photo or a story card
 *   - the question and 4 big coloured answers (colour + shape + text)
 *   - right answer -> the button turns GREEN, then "Well Done! You did Great!"
 *     wrong answer -> the button turns RED, then "Oh no… Let's try this again later!"
 *   - right answers also show the space candies won ("+1 🍬")
 *
 * Give it a `key` (the question id), so it starts fresh for every question.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Question } from '../models/Question';
import { colors, fontSizes, fonts, minTouchSize, radius, spacing } from '../theme/theme';
import AppText from './AppText';
import FeedbackPopup from './FeedbackPopup';
import PhotoCard from './PhotoCard';
import SceneCard from './SceneCard';

/** How an answer button looks right now. */
export type AnswerLook = 'idle' | 'right' | 'wrong' | 'dimmed';

/** Shapes on the answer buttons, like Kahoot. They help children who cannot read colours well. */
const ANSWER_SHAPES = ['▲', '◆', '●', '■'];

/**
 * Text longer than this gets a slightly smaller font (still big), so the
 * photo, the question and all 4 answers fit on one phone screen.
 */
const LONG_QUESTION = 45;
const LONG_ANSWER = 26;

/** Wait this long (ms) after the green/red highlight before the popup opens. */
const POPUP_DELAY_MS = 700;

/**
 * Decides how one answer button looks.
 *  - Nothing picked yet          -> 'idle' (its normal colour)
 *  - This is the picked answer   -> 'right' (green) or 'wrong' (red)
 *  - Another answer was picked   -> 'dimmed'
 * Kept outside the component so it is easy to test.
 */
export function getAnswerLook(
  answer: string,
  picked: string | null,
  correct: string,
): AnswerLook {
  if (picked === null) {
    return 'idle';
  }
  if (answer === picked) {
    return answer === correct ? 'right' : 'wrong';
  }
  return 'dimmed';
}

interface QuizQuestionProps {
  question: Question;
  /** The answers in the order to show them (default: as in questions.json). */
  answers?: string[];
  /** 0-based number of this question, and how many there are. */
  index: number;
  total: number;
  /** Space candies for a right answer (shown in the popup; 0 = none). */
  candies?: number;
  /** Called as soon as an answer is picked. */
  onAnswer: (right: boolean) => void;
  /** Called when the child closes the popup. */
  onContinue: () => void;
}

export default function QuizQuestion({
  question,
  answers = question.answers,
  index,
  total,
  candies = 0,
  onAnswer,
  onContinue,
}: QuizQuestionProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  // Kept in its own state (not worked out from `picked`) so the popup does
  // not flash the other colour while it fades out.
  const [lastAnswerRight, setLastAnswerRight] = useState(false);

  // After an answer is picked: show the highlight first, then the popup.
  useEffect(() => {
    if (picked === null) {
      return;
    }
    const timer = setTimeout(() => setPopupVisible(true), POPUP_DELAY_MS);
    return () => clearTimeout(timer); // tidy up if the screen closes early
  }, [picked]);

  /** The child tapped an answer. Only the first tap counts. */
  const pickAnswer = (answer: string) => {
    if (picked !== null) {
      return;
    }
    const right = question.isCorrect(answer);
    setPicked(answer);
    setLastAnswerRight(right);
    onAnswer(right);
  };

  const continueAfterPopup = () => {
    setPopupVisible(false);
    onContinue();
  };

  return (
    <>
      {/* Progress: "Question 2 of 4" + one dot per question */}
      <View style={styles.progressRow}>
        <AppText style={styles.progressText}>
          Question {index + 1} of {total}
        </AppText>
        <View style={styles.progressDots}>
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i <= index && styles.progressDotDone]}
            />
          ))}
        </View>
      </View>

      {/* A photo (210px: tall enough to read the face, small enough
          that all 4 answers fit without scrolling), a story card,
          or a photo with a short story under it. */}
      {question.image ? (
        <>
          <PhotoCard
            photoId={question.image}
            height={
              question.scene || question.question.length > LONG_QUESTION
                ? 170
                : 210
            }
          />
          {question.scene && <SceneCard text={question.scene} compact />}
        </>
      ) : (
        <SceneCard
          text={question.scene ?? ''}
          icon={question.sceneIcon}
        />
      )}

      <AppText
        style={[
          styles.question,
          question.question.length > LONG_QUESTION &&
            styles.questionLong,
        ]}>
        {question.question}
      </AppText>

      {/* The 4 answers, Kahoot style: colour + shape + text. */}
      <View style={styles.answers}>
        {answers.map((answer, i) => {
          const look = getAnswerLook(answer, picked, question.correct);
          const color = colors.answers[i % colors.answers.length];
          return (
            <Pressable
              key={answer}
              onPress={() => pickAnswer(answer)}
              disabled={picked !== null}
              accessibilityRole="button"
              accessibilityLabel={`Answer: ${answer}`}
              accessibilityState={{
                disabled: picked !== null,
                selected: answer === picked,
              }}
              style={({ pressed }) => [
                styles.answer,
                { backgroundColor: color },
                look === 'right' && styles.answerRight,
                look === 'wrong' && styles.answerWrong,
                look === 'dimmed' && styles.answerDimmed,
                pressed && styles.answerPressed,
              ]}>
              <AppText style={styles.answerShape}>
                {ANSWER_SHAPES[i % ANSWER_SHAPES.length]}
              </AppText>
              <AppText
                style={[
                  styles.answerText,
                  answer.length > LONG_ANSWER && styles.answerTextLong,
                ]}>
                {answer}
              </AppText>
              {/* ✓ / ✗ as well as colour, so it is clear without
                  colour too */}
              {look === 'right' && (
                <AppText style={styles.answerMark}>✓</AppText>
              )}
              {look === 'wrong' && (
                <AppText style={styles.answerMark}>✗</AppText>
              )}
            </Pressable>
          );
        })}
      </View>

      <FeedbackPopup
        visible={popupVisible}
        correct={lastAnswerRight}
        isLastQuestion={index === total - 1}
        candies={lastAnswerRight ? candies : 0}
        onContinue={continueAfterPopup}
      />
    </>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressText: {
    fontFamily: fonts.semiBold,
    color: colors.textSoft,
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  progressDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.purpleGlow,
  },
  progressDotDone: {
    backgroundColor: colors.purpleGlow,
  },
  question: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * 1.3,
    textAlign: 'center',
  },
  questionLong: {
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  answers: {
    gap: spacing.sm,
  },
  answer: {
    minHeight: minTouchSize + 8,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  answerRight: {
    backgroundColor: colors.correct,
    borderColor: colors.textLight,
  },
  answerWrong: {
    backgroundColor: colors.wrong,
    borderColor: colors.textLight,
  },
  answerDimmed: {
    opacity: 0.4,
  },
  answerPressed: {
    transform: [{ scale: 0.97 }],
  },
  answerShape: {
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
    width: 28,
    textAlign: 'center',
  },
  answerText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  answerTextLong: {
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.3,
  },
  answerMark: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * 1.2,
  },
});
