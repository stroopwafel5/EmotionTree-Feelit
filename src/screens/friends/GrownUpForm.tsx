/**
 * GrownUpForm.tsx
 * --------------------------------------------------------------------------
 * For grown-ups: the account password + a new 4-number GROWN-UP PIN.
 * Turns on Friends straight away (no waiting for an email), or makes a PIN
 * for an account that doesn't have one yet.
 *
 * The password is checked on the phone first (so it is really the
 * grown-up), then the server saves the PIN (as a hash).
 */
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import AppText from '../../components/AppText';
import KidButton from '../../components/KidButton';
import { ApiError } from '../../services/api';
import { authService, type Account } from '../../services/authService';
import { friendsService } from '../../services/friendsService';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';

interface GrownUpFormProps {
  account: Account;
  /** Text on the button, e.g. "Turn on Friends". */
  label: string;
  /** Done: Friends is on / the PIN is made (the new login is saved). */
  onDone: () => void;
}

export default function GrownUpForm({ account, label, onDone }: GrownUpFormProps) {
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (!/^\d{4}$/.test(pin)) {
      setError('The grown-up PIN must be 4 numbers.');
      return;
    }
    if (pin !== pin2) {
      setError('The two PINs are not the same. Please type them again.');
      return;
    }
    setBusy(true);
    try {
      // 1. Is it really the grown-up? (the password of this account)
      const check = await authService.checkPassword(account.username, password);
      if (!check.ok) {
        setError(check.error);
        return;
      }
      // 2. Turn on Friends with the PIN.
      await friendsService.connect(account.id, account, password, pin);
      setPassword('');
      setPin('');
      setPin2('');
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Account password"
        placeholderTextColor="#B9A6E0"
        accessibilityLabel="Password"
        autoCapitalize="none"
        style={styles.input}
      />
      <AppText style={styles.label}>Make a grown-up PIN (4 numbers). You'll use it to approve friends and change settings.</AppText>
      <View style={styles.row}>
        <TextInput
          value={pin}
          onChangeText={t => setPin(t.replace(/\D/g, '').slice(0, 4))}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          placeholder="PIN"
          placeholderTextColor="#B9A6E0"
          accessibilityLabel="Grown-up PIN"
          style={[styles.input, styles.pin]}
        />
        <TextInput
          value={pin2}
          onChangeText={t => setPin2(t.replace(/\D/g, '').slice(0, 4))}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          placeholder="PIN again"
          placeholderTextColor="#B9A6E0"
          accessibilityLabel="Grown-up PIN again"
          onSubmitEditing={submit}
          style={[styles.input, styles.pin]}
        />
      </View>
      {error ? (
        <AppText style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
      <KidButton label={busy ? 'Please wait…' : label} onPress={submit} disabled={busy || !password || !pin || !pin2} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.spacePanel,
    borderWidth: 2,
    borderColor: colors.purpleGlow,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    color: colors.textLight,
    fontFamily: fonts.regular,
    fontSize: fontSizes.body,
  },
  label: {
    color: colors.textSoft,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.45,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pin: {
    flex: 1,
  },
  error: {
    color: '#FCA5A5',
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
});
