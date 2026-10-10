/**
 * LevelPlayer.tsx
 * --------------------------------------------------------------------------
 * The screen behind Level.play(). It runs one level from start to end:
 *
 *   1. EXPLANATION - what the feeling is and how to tell, photos of real
 *                    people, how to help, short stories about kids and
 *                    space friends, and a "What makes YOU ...?" balloon.
 *                    Button: "I'm ready for the quiz!"
 *   2. QUIZ        - one question at a time, Kahoot style: a photo or a
 *                    story card, the question, and 4 big coloured answers.
 *                    * right answer -> the button turns GREEN, then the
 *                      "Well Done! You did Great!" popup
 *                    * wrong answer -> the button turns RED, then the
 *                      "Oh no… Let's try this again later!" popup
 *                    The child then moves on to the next question.
 *   3. DONE        - after the last question we call onAllQuestionsAnswered
 *                    (Level.finish: completed = TRUE + redraw the tree) and
 *                    show a "You finished!" screen.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { Level } from '../models/Level';
import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';
import AppText from './AppText';
import AskYouBalloon from './AskYouBalloon';
import ExampleCard from './ExampleCard';
import KidButton from './KidButton';
import PhotoCard from './PhotoCard';
import QuizQuestion from './QuizQuestion';

// (The answer colours live in QuizQuestion.tsx now; re-exported for older imports.)
export { getAnswerLook, type AnswerLook } from './QuizQuestion';

interface LevelPlayerProps {
  level: Level;
  /** Called once, after the last question's popup is closed. */
  onAllQuestionsAnswered: () => void;
  /** Called when the child wants to go back to the tree. */
  onExit: () => void;
  /** Called for every right answer (space candies!). Optional. */
  onCorrectAnswer?: () => void;
  /** Candies for one right answer, and for finishing (shown to the child). */
  candiesPerAnswer?: number;
  finishBonus?: number;
}

/** The three parts of a level. */
type Phase = 'explanation' | 'quiz' | 'done';

export default function LevelPlayer({
  level,
  onAllQuestionsAnswered,
  onExit,
  onCorrectAnswer,
  candiesPerAnswer = 0,
  finishBonus = 0,
}: LevelPlayerProps) {
  const explanation = level.getExplanation();
  const questions = level.getQuestions();

  const [phase, setPhase] = useState<Phase>('explanation');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

  // Scroll back to the top whenever a new part / question starts.
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [phase, questionIndex]);

  const question = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;

  /** Ends the level: tells Level to mark itself completed, then shows "done". */
  const finishLevel = () => {
    onAllQuestionsAnswered();
    setPhase('done');
  };

  /** "I'm ready for the quiz!" was tapped. */
  const startQuiz = () => {
    if (questions.length === 0) {
      finishLevel(); // a level with no questions is done straight away
    } else {
      setPhase('quiz');
    }
  };

  /** An answer was picked (QuizQuestion shows green/red and the popup). */
  const answeredRight = (right: boolean) => {
    if (right) {
      setScore(s => s + 1);
      onCorrectAnswer?.();
    }
  };

  /** The child closed the popup: go to the next question, or finish. */
  const continueAfterPopup = () => {
    if (isLastQuestion) {
      finishLevel();
    } else {
      setQuestionIndex(i => i + 1);
    }
  };

  const candiesWon = score * candiesPerAnswer + finishBonus;

  return (
    <View style={styles.screen}>
      {/* Top bar: back button + level name. Same place on every page. */}
      <View style={styles.topBar}>
        <KidButton
          label="✕ My tree"
          variant="soft"
          onPress={onExit}
          accessibilityLabel="Go back to my tree"
        />
        <AppText style={styles.levelName} numberOfLines={1}>
          {level.getIcon()} {level.getName()}
        </AppText>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* ---------------- PART 1: EXPLANATION ---------------- */}
        {phase === 'explanation' && (
          <>
            <AppText style={styles.title}>
              Let's learn: {level.getName()}
            </AppText>

            <View style={styles.card}>
              <AppText style={styles.cardHeading}>What is it? 🤔</AppText>
              {explanation.getExplanationLines().map((line, i) => (
                <AppText key={i} style={styles.cardLine}>
                  {line}
                </AppText>
              ))}
            </View>

            <AppText style={styles.subTitle}>Look at these photos 👀</AppText>
            {explanation.photos.map(photoId => (
              <PhotoCard key={photoId} photoId={photoId} height={220} />
            ))}

            <View style={[styles.card, styles.helpCard]}>
              <AppText style={styles.cardHeading}>
                {explanation.howToHelpTitle}
              </AppText>
              {explanation.getHowToHelpLines().map((line, i) => (
                <AppText key={i} style={styles.cardLine}>
                  {line}
                </AppText>
              ))}
            </View>

            {/* Short stories about kids and space friends. */}
            {explanation.hasExamples() && (
              <View style={[styles.card, styles.storiesCard]}>
                <AppText style={styles.cardHeading}>Stories 📖</AppText>
                {explanation.examples.map((example, i) => (
                  <ExampleCard key={i} example={example} />
                ))}
              </View>
            )}

            {/* "What makes YOU happy?" - a question to think about. */}
            {explanation.askYou !== '' && (
              <AskYouBalloon question={explanation.askYou} />
            )}

            <KidButton
              label="I'm ready for the quiz! 🚀"
              onPress={startQuiz}
            />
          </>
        )}

        {/* ---------------- PART 2: QUIZ ---------------- */}
        {phase === 'quiz' && question && (
          <>
            <QuizQuestion
              key={question.id}
              question={question}
              index={questionIndex}
              total={questions.length}
              candies={candiesPerAnswer}
              onAnswer={answeredRight}
              onContinue={continueAfterPopup}
            />
          </>
        )}

        {/* ---------------- DONE ---------------- */}
        {phase === 'done' && (
          <View style={styles.doneBox}>
            <AppText style={styles.doneIcon}>🌟</AppText>
            <AppText style={styles.title}>
              You finished {level.getName()}!
            </AppText>
            <AppText style={styles.doneText}>
              You got {score} of {questions.length} right.
            </AppText>
            <AppText style={styles.doneText}>
              Your leaf is now light purple. 💜
            </AppText>
            {candiesWon > 0 && (
              <View style={styles.candyBox}>
                <AppText style={styles.candyText}>+{candiesWon} 🍬 space candies!</AppText>
              </View>
            )}
            <KidButton
              label="Back to my tree 🌈"
              onPress={onExit}
              style={styles.doneButton}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  levelName: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.semiBold,
    color: colors.textSoft,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * 1.3,
    textAlign: 'center',
  },
  subTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    gap: spacing.xs,
  },
  helpCard: {
    borderColor: colors.rainbow[3],
  },
  storiesCard: {
    borderColor: colors.rainbow[4],
    gap: spacing.md,
  },
  cardHeading: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.4,
    color: colors.purpleBright,
  },
  cardLine: {
    color: colors.textDark,
  },
  doneBox: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  doneIcon: {
    fontSize: 80,
    lineHeight: 100,
  },
  doneText: {
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.4,
    textAlign: 'center',
    color: colors.textSoft,
  },
  candyBox: {
    backgroundColor: colors.card,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  candyText: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  doneButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
