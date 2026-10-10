/**
 * TestScreen.tsx
 * --------------------------------------------------------------------------
 * The Feelings Test: shows how well the child knows what they learned so
 * far. The questions are MIXED from the finished leaves (Happiness,
 * Sadness, Anger...), in a new order every time (see testBuilder.ts).
 *
 *   1. START    - which feelings are in the test, how many questions
 *   2. QUESTIONS - the same Kahoot-style questions as in the leaves
 *                 (+1 🍬 for every right answer)
 *   3. RESULTS  - stars, score, candies, and each feeling: "2 of 2 ✓" or
 *                 "practice this leaf again"
 *
 * Kind words only: every result ends with something positive.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../components/AppText';
import KidButton from '../components/KidButton';
import QuizQuestion from '../components/QuizQuestion';
import CandyCounter from '../components/rewards/CandyCounter';
import TopBar from '../components/TopBar';
import type { Level } from '../models/Level';
import { CANDIES, TEST_SETTINGS, starsFor, testBonus, type TestRecord } from '../models/Rewards';
import { buildTest, canTakeTest, learnedLevels, resultsByLevel } from '../services/testBuilder';
import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';

interface TestScreenProps {
  levels: Level[];
  candies: number;
  /** Best score so far in %, or null. */
  best: number | null;
  /** A right answer (give a candy). */
  onCorrectAnswer: () => void;
  /** The test is finished (save it, give the bonus, count the mission). */
  onFinished: (test: TestRecord) => void;
  onHome: () => void;
  /** Go to the tree (when the test is still locked). */
  onTree: () => void;
}

type Phase = 'start' | 'questions' | 'results';

export default function TestScreen({
  levels,
  candies,
  best,
  onCorrectAnswer,
  onFinished,
  onHome,
  onTree,
}: TestScreenProps) {
  const [phase, setPhase] = useState<Phase>('start');
  // A new set of questions each time "Start" is tapped.
  const [round, setRound] = useState(0);
  const questions = useMemo(() => buildTest(levels), [levels, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [phase, index]);

  const learned = learnedLevels(levels);
  const unlocked = canTakeTest(levels);

  const start = () => {
    setRound(r => r + 1);
    setIndex(0);
    setAnswers([]);
    setPhase('questions');
  };

  const answered = (right: boolean) => {
    setAnswers(a => [...a, right]);
    if (right) {
      onCorrectAnswer();
    }
  };

  const next = () => {
    if (index < questions.length - 1) {
      setIndex(i => i + 1);
      return;
    }
    // The last question: save the test.
    const byLevel: TestRecord['byLevel'] = {};
    for (const row of resultsByLevel(questions, answers)) {
      byLevel[String(row.levelId)] = [row.right, row.asked];
    }
    onFinished({
      at: new Date().toISOString(),
      score: answers.filter(Boolean).length,
      total: questions.length,
      byLevel,
    });
    setPhase('results');
  };

  const score = answers.filter(Boolean).length;
  const total = questions.length;
  const stars = starsFor(score, total);

  return (
    <View style={styles.screen}>
      <TopBar
        title="🧪 Test"
        onBack={onHome}
        backLabel="🏠 Home"
        backHint="Go back home"
        right={<CandyCounter candies={candies} />}
      />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {/* ---------------- START ---------------- */}
        {phase === 'start' && !unlocked && (
          <View style={styles.box}>
            <AppText style={styles.bigIcon}>🔒</AppText>
            <AppText style={styles.title}>Almost ready!</AppText>
            <AppText style={styles.text}>
              Finish {TEST_SETTINGS.leavesNeeded} leaves on your tree first. Then the test can mix their questions.
            </AppText>
            <AppText style={styles.text}>
              Leaves done: {learned.length} of {TEST_SETTINGS.leavesNeeded}
            </AppText>
            <KidButton label="Go to my tree 🌈" onPress={onTree} style={styles.wide} />
          </View>
        )}
        {phase === 'start' && unlocked && (
          <View style={styles.box}>
            <AppText style={styles.bigIcon}>🧪</AppText>
            <AppText style={styles.title}>Show what you know!</AppText>
            <AppText style={styles.text}>
              {Math.min(TEST_SETTINGS.questions, learned.reduce((n, l) => n + l.getQuestions().length, 0))} mixed
              questions about:
            </AppText>
            <View style={styles.feelings}>
              {learned.map(level => (
                <View key={level.getId()} style={styles.feelingChip}>
                  <AppText style={styles.feelingChipText}>
                    {level.getIcon()} {level.getName()}
                  </AppText>
                </View>
              ))}
            </View>
            <AppText style={styles.text}>You get {CANDIES.rightAnswer} 🍬 for every right answer!</AppText>
            {best !== null && <AppText style={styles.small}>Your best so far: {best}%</AppText>}
            <KidButton label="Start the test 🚀" onPress={start} style={styles.wide} />
          </View>
        )}

        {/* ---------------- QUESTIONS ---------------- */}
        {phase === 'questions' && questions[index] && (
          <QuizQuestion
            key={`${round}-${index}`}
            question={questions[index].question}
            answers={questions[index].answers}
            index={index}
            total={total}
            candies={CANDIES.rightAnswer}
            onAnswer={answered}
            onContinue={next}
          />
        )}

        {/* ---------------- RESULTS ---------------- */}
        {phase === 'results' && (
          <View style={styles.box}>
            <AppText style={styles.stars} accessibilityLabel={`${stars} of 3 stars`}>
              {'⭐'.repeat(stars)}
              <AppText style={styles.starOff}>{'☆'.repeat(3 - stars)}</AppText>
            </AppText>
            <AppText style={styles.title}>
              {stars === 3 ? 'Amazing! 🌟' : stars === 2 ? 'Great job! 🎉' : stars === 1 ? 'Good try! 💜' : 'Keep practicing! 💜'}
            </AppText>
            <AppText style={styles.text}>
              You got {score} of {total} right.
            </AppText>
            <View style={styles.candyBox}>
              <AppText style={styles.candyText}>
                +{score * CANDIES.rightAnswer + testBonus(score, total)} 🍬 space candies!
              </AppText>
              {score === total && total > 0 && (
                <AppText style={styles.candySmall}>Perfect test bonus included! 🏆</AppText>
              )}
            </View>

            <View style={styles.resultList}>
              {resultsByLevel(questions, answers).map(row => {
                const allRight = row.right === row.asked;
                return (
                  <View key={row.levelId} style={styles.resultRow}>
                    <AppText style={styles.resultName}>
                      {row.levelIcon} {row.levelName}
                    </AppText>
                    <AppText style={styles.resultScore}>
                      {row.right} of {row.asked} {allRight ? '✓' : ''}
                    </AppText>
                    {!allRight && (
                      <AppText style={styles.resultTip}>Play this leaf again to practice 🍃</AppText>
                    )}
                  </View>
                );
              })}
            </View>

            <KidButton label="Another test 🧪" onPress={start} style={styles.wide} />
            <KidButton label="Back home 🏠" variant="soft" onPress={onHome} style={styles.wide} />
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
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
  },
  box: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  bigIcon: {
    fontSize: 72,
    lineHeight: 90,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * 1.3,
    textAlign: 'center',
  },
  text: {
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.4,
    textAlign: 'center',
    color: colors.textSoft,
  },
  small: {
    color: colors.textSoft,
    textAlign: 'center',
  },
  feelings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  feelingChip: {
    backgroundColor: colors.spacePanel,
    borderWidth: 2,
    borderColor: colors.purpleGlow,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  feelingChipText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  wide: {
    alignSelf: 'stretch',
  },
  stars: {
    fontSize: 56,
    lineHeight: 72,
    textAlign: 'center',
  },
  starOff: {
    color: '#6D4AAE',
    fontSize: 56,
    lineHeight: 72,
  },
  candyBox: {
    backgroundColor: '#FCE7F3',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  candyText: {
    color: '#9D174D',
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  candySmall: {
    color: '#9D174D',
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  resultList: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  resultRow: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  resultName: {
    color: colors.textDark,
    fontFamily: fonts.bold,
  },
  resultScore: {
    color: colors.textDark,
  },
  resultTip: {
    color: colors.leafNext,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
});
