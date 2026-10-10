/**
 * GrownUpScreen.tsx
 * --------------------------------------------------------------------------
 * The Grown-up corner 👪 (Friends → For grown-ups). Locked with the 4-number
 * grown-up PIN, so grown-ups can do everything right here, without waiting
 * for emails:
 *
 *   - Worrying things the child told their space buddy (if any)
 *   - Waiting for you: friend requests and school group invites
 *     (Approve / Decline)
 *   - Typed messages and voice messages: on or off
 *   - Open the parent page (read chats...) in the browser - no email needed
 *   - Change the PIN
 *
 * The PIN is checked by the server every time (5 wrong tries: wait 5
 * minutes). It is only kept in memory while this screen is open.
 * An account without a PIN yet first makes one (with the account password).
 */
import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../../components/AppText';
import KidButton from '../../components/KidButton';
import PinPad from '../../components/PinPad';
import TopBar from '../../components/TopBar';
import { ApiError } from '../../services/api';
import type { Account } from '../../services/authService';
import { friendsService, type GrownUpView } from '../../services/friendsService';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';
import GrownUpForm from './GrownUpForm';

interface GrownUpScreenProps {
  token: string;
  account: Account;
  /** False for older accounts that don't have a PIN yet. */
  hasPin: boolean;
  onBack: () => void;
  /** A PIN was made with the password (a new login was saved). */
  onReconnected: () => void;
}

type Phase = 'make' | 'pin' | 'panel' | 'newPin' | 'confirmPin';

export default function GrownUpScreen({ token, account, hasPin, onBack, onReconnected }: GrownUpScreenProps) {
  const [phase, setPhase] = useState<Phase>(hasPin ? 'pin' : 'make');
  const [pin, setPin] = useState('');
  const [view, setView] = useState<GrownUpView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [padKey, setPadKey] = useState(0);

  useEffect(() => {
    if (hasPin && phase === 'make') {
      setPhase('pin');
    }
  }, [hasPin, phase]);

  /** Runs a grown-up action and shows its answer (or its problem). */
  const run = async (action: () => Promise<GrownUpView | unknown>, done?: string) => {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const result = await action();
      if (result && typeof result === 'object' && 'waiting' in result) {
        setView(result as GrownUpView);
      }
      if (done) {
        setNote(done);
      }
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const unlock = async (typed: string) => {
    const ok = await run(() => friendsService.grownUp(token, typed));
    if (ok) {
      setPin(typed);
      setPhase('panel');
    } else {
      setPadKey(k => k + 1);
    }
  };

  const openParentPage = () =>
    run(async () => {
      const url = await friendsService.parentPageUrl(token, pin);
      await Linking.openURL(url);
    }, 'The parent page opened in the browser.');

  const top = <TopBar title="👪 Grown-up corner" onBack={onBack} />;

  // ---- No PIN yet: make one (with the account password) ----
  if (phase === 'make') {
    return (
      <View style={styles.screen}>
        {top}
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppText style={styles.text}>
            For grown-ups: make a grown-up PIN. Then you can approve friends and groups, and change settings, right
            here.
          </AppText>
          <GrownUpForm
            account={account}
            label="Make the PIN"
            onDone={() => {
              onReconnected();
              setPhase('pin');
            }}
          />
        </ScrollView>
      </View>
    );
  }

  // ---- Type the PIN (also: a new PIN, twice) ----
  if (phase === 'pin' || phase === 'newPin' || phase === 'confirmPin') {
    const titles = {
      pin: 'Grown-ups only: type the PIN',
      newPin: 'Type a NEW PIN',
      confirmPin: 'Type the new PIN again',
    };
    return (
      <View style={styles.screen}>
        {top}
        <ScrollView contentContainerStyle={styles.content}>
          <PinPad
            key={`${phase}-${padKey}`}
            title={titles[phase]}
            hint={phase === 'pin' ? 'Forgot it? Make a new one on the parent page (we can email you a link).' : undefined}
            error={error}
            busy={busy}
            onComplete={typed => {
              if (phase === 'pin') {
                unlock(typed);
              } else if (phase === 'newPin') {
                setNewPin(typed);
                setError(null);
                setPhase('confirmPin');
              } else if (typed !== newPin) {
                setError('The two PINs are not the same. Please start again.');
                setPhase('newPin');
              } else {
                run(() => friendsService.changePin(token, pin, typed), 'The new PIN is saved. ✅').then(ok => {
                  if (ok) {
                    setPin(typed);
                  }
                  setPhase('panel');
                });
              }
            }}
          />
          {phase !== 'pin' && <KidButton label="Cancel" variant="soft" onPress={() => setPhase('panel')} />}
          {phase === 'pin' && (
            <KidButton
              label="📧 Email me the parent page"
              variant="soft"
              onPress={() => run(() => friendsService.emailParentLink(token), 'We emailed you a link to the parent page. 📧')}
            />
          )}
          {note ? <AppText style={styles.note}>{note}</AppText> : null}
        </ScrollView>
      </View>
    );
  }

  // ---- The panel ----
  const waiting = view?.waiting ?? [];
  const alerts = view?.alerts ?? [];
  const settings = view?.settings ?? { freeText: false, voice: false };
  const toggle = (label: string, key: 'freeText' | 'voice') => (
    <View style={styles.settingRow}>
      <AppText style={styles.settingText}>
        {label}: <AppText style={settings[key] ? styles.on : styles.off}>{settings[key] ? 'ON' : 'OFF'}</AppText>
      </AppText>
      <KidButton
        label={settings[key] ? 'Turn off' : 'Turn on'}
        variant={settings[key] ? 'soft' : 'main'}
        onPress={() => run(() => friendsService.grownUpSettings(token, pin, { [key]: !settings[key] }), 'Saved! ✅')}
        disabled={busy}
        style={settings[key] ? styles.darkSoft : undefined}
      />
    </View>
  );

  return (
    <View style={styles.screen}>
      {top}
      <ScrollView contentContainerStyle={styles.content}>
        {note ? (
          <View style={styles.noteBox}>
            <AppText style={styles.noteText}>{note}</AppText>
          </View>
        ) : null}
        {error ? <AppText style={styles.error}>{error}</AppText> : null}

        {alerts.length > 0 ? (
          <View style={[styles.card, styles.worryCard]}>
            <AppText style={styles.heading}>🚨 Worrying things {account.username} told the space buddy</AppText>
            <AppText style={styles.cardText}>Only you (and the teacher of a school group) see these. Please talk with your child.</AppText>
            {alerts.map(a => (
              <View key={a.id} style={styles.waitItem}>
                <AppText style={styles.worryTitle}>
                  {a.seen ? '✓ ' : ''}
                  {a.title} · {new Date(a.at).toLocaleString()}
                </AppText>
                <AppText style={styles.worryText}>“{a.text}”</AppText>
                {!a.seen ? (
                  <KidButton
                    label="We talked about it ✓"
                    onPress={() => run(() => friendsService.grownUpAlertSeen(token, pin, a.id), 'Thank you. 💜')}
                    disabled={busy}
                  />
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <AppText style={styles.heading}>Waiting for you</AppText>
          {waiting.length === 0 ? (
            <AppText style={styles.cardText}>Nothing right now. ✅</AppText>
          ) : (
            waiting.map(w => (
              <View key={`${w.type}-${w.id}`} style={styles.waitItem}>
                <AppText style={styles.cardText}>
                  {w.type === 'friend' ? '🤝 ' : '🏫 '}
                  {w.text}
                </AppText>
                <View style={styles.buttons}>
                  <KidButton
                    label="Approve"
                    onPress={() => run(() => friendsService.grownUpDecide(token, pin, w.type, w.id, true), 'Approved! 💜')}
                    disabled={busy}
                  />
                  <KidButton
                    label="Decline"
                    variant="soft"
                    onPress={() => run(() => friendsService.grownUpDecide(token, pin, w.type, w.id, false), 'Declined.')}
                    disabled={busy}
                    style={styles.darkSoft}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <AppText style={styles.heading}>Messages</AppText>
          <AppText style={styles.cardText}>
            Ready-made words and feelings are always on. Between friends, typing and voice work only when BOTH grown-ups
            turned them on.
          </AppText>
          {toggle('⌨️ Typed messages', 'freeText')}
          {toggle('🎤 Voice messages', 'voice')}
        </View>

        <View style={styles.card}>
          <AppText style={styles.heading}>Parent page</AppText>
          <AppText style={styles.cardText}>Read all chats, see "Tell my grown-up" messages and the weekly check-up.</AppText>
          <KidButton label="🌐 Open the parent page" onPress={openParentPage} disabled={busy} />
        </View>

        <KidButton label="🔑 Change the PIN" variant="soft" onPress={() => setPhase('newPin')} />
        <KidButton label="🔒 Lock and go back" variant="soft" onPress={onBack} />
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
    paddingBottom: spacing.xl,
  },
  text: {
    color: colors.textSoft,
  },
  note: {
    color: colors.textSoft,
    textAlign: 'center',
  },
  noteBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  noteText: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
  error: {
    color: '#FCA5A5',
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  heading: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  cardText: {
    color: colors.textDark,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.4,
  },
  waitItem: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: '#E4D4FB',
    paddingTop: spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  settingText: {
    flex: 1,
    color: colors.textDark,
    fontFamily: fonts.semiBold,
  },
  on: {
    color: colors.correct,
    fontFamily: fonts.bold,
  },
  off: {
    color: colors.wrong,
    fontFamily: fonts.bold,
  },
  darkSoft: {
    backgroundColor: colors.leafNext,
  },
  worryCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 3,
    borderColor: '#FB923C',
  },
  worryTitle: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  worryText: {
    color: colors.textDark,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.4,
  },
});
