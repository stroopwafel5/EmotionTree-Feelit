/**
 * LoginScreen.tsx
 * --------------------------------------------------------------------------
 * The LogIn Screen from the brief: a grown-up makes an account for the
 * child (Username + Email + Password), or logs in to an account made before.
 *
 * Two tabs at the top:
 *   "Log in"          - Username + Password
 *   "Make an account" - Username + Email + Password
 *
 * All the real work (checking, hashing, saving) happens in authService.ts.
 * This screen only shows the form and the result.
 *
 * Kid-friendly details:
 *  - big text boxes with a label ABOVE each one (not inside, where the label
 *    would disappear while typing)
 *  - one clear error message at a time, in a soft box, in easy English
 *  - a "Show password" switch, so mistakes are easy to spot
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import AppText from '../components/AppText';
import KidButton from '../components/KidButton';
import { authService, type Account } from '../services/authService';
import {
  colors,
  fontSizes,
  fonts,
  minTouchSize,
  radius,
  spacing,
} from '../theme/theme';

interface LoginScreenProps {
  /** Called after a successful log in or sign up. */
  onLoggedIn: (user: Account) => void;
}

/** Which tab is open. */
type Mode = 'logIn' | 'signUp';

export default function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>('logIn');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === 'signUp';

  /** Switches tab and clears the old error and password. */
  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setPassword('');
  };

  /** The big button: log in or make the account. */
  const submit = async () => {
    if (busy) {
      return; // ignore double taps
    }
    setBusy(true);
    setError(null);
    try {
      const result = isSignUp
        ? await authService.register(username, email, password)
        : await authService.logIn(username, password);
      if (result.ok) {
        onLoggedIn(result.user);
        return; // this screen closes now
      }
      setError(result.error);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {/* ---- Title ---- */}
        <AppText style={styles.logo}>🚀</AppText>
        <AppText style={styles.title}>Emotion Tree</AppText>
        <AppText style={styles.subtitle}>
          Learn about feelings in space!
        </AppText>
        <AppText style={styles.grownUpNote}>
          👋 Grown-ups: please log in, or make an account for your child.
        </AppText>

        <View style={styles.card}>
          {/* ---- Tabs ---- */}
          <View style={styles.tabs} accessibilityRole="tablist">
            <Tab
              label="Log in"
              active={!isSignUp}
              onPress={() => switchMode('logIn')}
            />
            <Tab
              label="Make an account"
              active={isSignUp}
              onPress={() => switchMode('signUp')}
            />
          </View>

          {/* ---- Fields ---- */}
          <Field
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoComplete="username"
            placeholder="for example: star_kid"
          />

          {isSignUp && (
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoComplete="email"
              keyboardType="email-address"
              placeholder="name@mail.com"
            />
          )}

          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            autoComplete={isSignUp ? 'new-password' : 'password'}
            secureTextEntry={!showPassword}
            placeholder={isSignUp ? '8+ letters and numbers' : ''}
            onSubmitEditing={submit}
          />

          {/* ---- Show password ---- */}
          <Pressable
            onPress={() => setShowPassword(s => !s)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: showPassword }}
            style={styles.showRow}>
            <View style={[styles.checkbox, showPassword && styles.checked]}>
              {showPassword && <AppText style={styles.tick}>✓</AppText>}
            </View>
            <AppText style={styles.showText}>Show password</AppText>
          </Pressable>

          {/* ---- Error (one at a time, easy English) ---- */}
          {error && (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <AppText style={styles.errorText}>💜 {error}</AppText>
            </View>
          )}

          {/* ---- Main button ---- */}
          {busy ? (
            <View style={styles.waiting} accessibilityLiveRegion="polite">
              <ActivityIndicator
                size="large"
                color={colors.purpleBright}
                style={styles.spinner}
              />
              <AppText style={styles.waitingText}>
                Keeping your password safe… ⏳
              </AppText>
            </View>
          ) : (
            <KidButton
              label={isSignUp ? 'Make my account ✨' : 'Log in ✨'}
              onPress={submit}
            />
          )}
        </View>

        <AppText style={styles.privacy}>
          🔒 Accounts stay on this device. Passwords are saved as a secret
          code (a hash), never as plain text.
        </AppText>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Small parts used only on this screen
// ---------------------------------------------------------------------------

/** One tab button at the top of the card. */
function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.tab, active && styles.tabActive]}>
      <AppText style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** A label + a big text box. */
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoComplete,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoComplete?: 'username' | 'email' | 'password' | 'new-password';
  onSubmitEditing?: () => void;
}) {
  return (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8B7BAF"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={onSubmitEditing}
        accessibilityLabel={label}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    lineHeight: 80,
    marginTop: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.huge,
    lineHeight: fontSizes.huge * 1.2,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.4,
    textAlign: 'center',
  },
  grownUpNote: {
    marginTop: spacing.md,
    color: colors.textSoft,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.5,
    textAlign: 'center',
  },
  card: {
    marginTop: spacing.lg,
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    padding: spacing.lg,
    gap: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E4D4FB',
    borderRadius: radius.round,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.purpleBright,
  },
  tabText: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.3,
    textAlign: 'center',
  },
  tabTextActive: {
    color: colors.textLight,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
  },
  input: {
    minHeight: minTouchSize,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.body,
    color: colors.textDark,
  },
  showRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.purpleBright,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: colors.purpleBright,
  },
  tick: {
    color: colors.textLight,
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  showText: {
    color: colors.textDark,
  },
  errorBox: {
    backgroundColor: '#FDE8EC',
    borderColor: '#F9A8B8',
    borderWidth: 2,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  errorText: {
    color: '#7F1D3A',
    fontSize: fontSizes.small + 2,
    lineHeight: (fontSizes.small + 2) * 1.45,
  },
  spinner: {
    minHeight: minTouchSize,
  },
  waiting: {
    alignItems: 'center',
  },
  waitingText: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'center',
  },
  privacy: {
    marginTop: spacing.lg,
    maxWidth: 460,
    color: colors.textSoft,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.5,
    textAlign: 'center',
  },
});
