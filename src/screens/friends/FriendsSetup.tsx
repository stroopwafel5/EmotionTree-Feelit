/**
 * FriendsSetup.tsx
 * --------------------------------------------------------------------------
 * Shown the first time a child opens Friends on this phone.
 * It explains (simply) how Friends works, and a GROWN-UP turns it on by
 * typing the account password and making a 4-number GROWN-UP PIN.
 * Friends is on straight away; the parent gets a short heads-up email.
 * The PIN is then used in the Grown-up corner to approve friends and
 * change settings - no waiting for emails.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../../components/AppText';
import TopBar from '../../components/TopBar';
import type { Account } from '../../services/authService';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';
import GrownUpForm from './GrownUpForm';

interface FriendsSetupProps {
  account: Account;
  /** Friends is on (the token is saved on the phone). */
  onConnected: () => void;
  onHome: () => void;
}

const STEPS = [
  { icon: '👪', text: 'A grown-up turns on Friends here and makes a grown-up PIN.' },
  { icon: '🔢', text: 'You get a friend code. Tell it to a friend you know.' },
  { icon: '🤝', text: 'Both grown-ups say yes (with their PIN). Then your friend says yes. Now you are friends!' },
];

export default function FriendsSetup({ account, onConnected, onHome }: FriendsSetupProps) {
  return (
    <View style={styles.screen}>
      <TopBar title="Friends" onBack={onHome} backLabel="🏠 Home" backHint="Go back home" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText style={styles.big}>💬</AppText>
        <AppText style={styles.title}>Talk with your friends and your grown-up!</AppText>

        <View style={styles.card}>
          {STEPS.map((step, i) => (
            <View key={step.text} style={styles.step}>
              <AppText style={styles.stepIcon}>{step.icon}</AppText>
              <AppText style={styles.stepText}>
                {i + 1}. {step.text}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.safeBox}>
          <AppText style={styles.safeText}>
            🛡️ Friends can send ready-made words, feelings, and (if a grown-up turns them on) typed and voice
            messages. Nobody can send pictures.
          </AppText>
        </View>

        <View style={styles.grownUp}>
          <AppText style={styles.grownUpTitle}>For grown-ups</AppText>
          <AppText style={styles.grownUpText}>
            Type the password of this account and make a grown-up PIN. Friends is on straight away. We send a short
            email to <AppText style={styles.bold}>{account.email}</AppText> so you know.
          </AppText>
          <GrownUpForm account={account} label="Turn on Friends" onDone={onConnected} />
        </View>
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
    gap: spacing.md,
    alignItems: 'stretch',
  },
  big: {
    fontSize: 64,
    lineHeight: 80,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepIcon: {
    fontSize: 30,
    lineHeight: 38,
    width: 40,
    textAlign: 'center',
  },
  stepText: {
    flex: 1,
    color: colors.textDark,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.4,
  },
  safeBox: {
    backgroundColor: colors.spacePanel,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.purpleGlow,
    padding: spacing.md,
  },
  safeText: {
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.45,
  },
  grownUp: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.textSoft,
    padding: spacing.md,
    gap: spacing.sm,
  },
  grownUpTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.3,
  },
  grownUpText: {
    color: colors.textSoft,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.45,
  },
  bold: {
    fontFamily: fonts.bold,
    color: colors.textLight,
  },
});
