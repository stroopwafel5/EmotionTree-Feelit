/**
 * BuddySettings.tsx
 * --------------------------------------------------------------------------
 * For grown-ups (Home → For grown-ups → Buddy settings), locked with the
 * account password:
 *
 *   - Buddy time on / off
 *   - OPEN TALK (typing to the buddy): OFF until a grown-up turns it on
 *   - Privacy and safety: what the buddy keeps (nothing) and when it tells
 *     the grown-up and teacher (worrying messages only)
 *   - TEACH MY BUDDY: what the buddy calls the child, topics the child loves,
 *     your own topics and facts, comfort words, things that help the child
 *     calm down, friends' and pets' names
 *
 * Everything here is saved ON THIS PHONE only (services/buddyService.ts).
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import AppText from '../../components/AppText';
import KidButton from '../../components/KidButton';
import TextEntryModal from '../../components/TextEntryModal';
import TopBar from '../../components/TopBar';
import { BUDDY, friendlyName, type BuddyNotebook } from '../../models/BuddyBrain';
import { authService, type Account } from '../../services/authService';
import { checkGrownUpText, LIMITS, type BuddySaved } from '../../services/buddyService';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';

interface BuddySettingsProps {
  account: Account;
  buddyName: string;
  buddy: BuddySaved;
  /** Friends is on (worry alerts can reach the grown-up). */
  friendsOn: boolean;
  /** Names of the child's school groups' schools (they get worry alerts too). */
  schools: string[];
  onChange: (next: BuddySaved) => void;
  onBack: () => void;
}

/** What a text box popup is for. */
type Editing =
  | { kind: 'nickname' }
  | { kind: 'list'; list: 'comfort' | 'calm' | 'friends' | 'pets' }
  | { kind: 'newTopic' }
  | { kind: 'topicIcon'; topicId: string }
  | { kind: 'fact'; topicId: string };

const ICONS = ['🐴', '⚽', '🎨', '🎵', '🚒', '🦄', '🧱', '🌈', '🐢', '🦋', '✈️', '🎮'];

export default function BuddySettings({ account, buddyName, buddy, friendsOn, schools, onChange, onBack }: BuddySettingsProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const child = buddy.notebook.nickname || friendlyName(account.username);
  const top = <TopBar title="🐾 Buddy settings" onBack={onBack} backLabel="← Back" backHint="Go back home" />;

  // ---- Locked: the account password ----
  if (!unlocked) {
    const unlock = async () => {
      setBusy(true);
      setError(null);
      const result = await authService.checkPassword(account.username, password);
      setBusy(false);
      if (result.ok) {
        setPassword('');
        setUnlocked(true);
      } else {
        setError(result.error);
      }
    };
    return (
      <View style={styles.screen}>
        {top}
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppText style={styles.big}>🔒</AppText>
          <AppText style={styles.title}>For grown-ups</AppText>
          <AppText style={styles.soft}>Type the password of this account to change the space buddy settings.</AppText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Account password"
            placeholderTextColor="#B9A6E0"
            accessibilityLabel="Password"
            autoCapitalize="none"
            onSubmitEditing={unlock}
            style={styles.input}
          />
          {error ? <AppText style={styles.error}>{error}</AppText> : null}
          <KidButton label={busy ? 'Please wait…' : 'Open'} onPress={unlock} disabled={busy || !password} />
        </ScrollView>
      </View>
    );
  }

  // ---- Unlocked ----
  const nb = buddy.notebook;
  const setNotebook = (change: Partial<BuddyNotebook>) => onChange({ ...buddy, notebook: { ...nb, ...change } });
  const toggle = (key: 'enabled' | 'typing') => onChange({ ...buddy, settings: { ...buddy.settings, [key]: !buddy.settings[key] } });

  const onOff = (label: string, about: string, key: 'enabled' | 'typing') => (
    <View style={styles.card}>
      <View style={styles.row}>
        <AppText style={styles.cardTitle}>
          {label}: <AppText style={buddy.settings[key] ? styles.on : styles.off}>{buddy.settings[key] ? 'ON' : 'OFF'}</AppText>
        </AppText>
        <KidButton
          label={buddy.settings[key] ? 'Turn off' : 'Turn on'}
          variant={buddy.settings[key] ? 'soft' : 'main'}
          onPress={() => toggle(key)}
          style={buddy.settings[key] ? styles.darkSoft : undefined}
          accessibilityLabel={`${label}: turn ${buddy.settings[key] ? 'off' : 'on'}`}
        />
      </View>
      <AppText style={styles.cardText}>{about}</AppText>
    </View>
  );

  /** A list the grown-up adds to (comfort words, names...). */
  const listCard = (list: 'comfort' | 'calm' | 'friends' | 'pets', title: string, about: string, addLabel: string) => (
    <View style={styles.sub}>
      <AppText style={styles.subTitle}>{title}</AppText>
      <AppText style={styles.cardText}>{about}</AppText>
      {nb[list].map((item, i) => (
        <View key={`${item}-${i}`} style={styles.item}>
          <AppText style={styles.itemText}>{item}</AppText>
          <Pressable
            onPress={() => setNotebook({ [list]: nb[list].filter((_, j) => j !== i) })}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item}`}
            style={styles.remove}>
            <AppText style={styles.removeText}>✕</AppText>
          </Pressable>
        </View>
      ))}
      {nb[list].length < LIMITS.list ? <KidButton label={addLabel} variant="soft" onPress={() => setEditing({ kind: 'list', list })} style={styles.darkSoft} /> : null}
    </View>
  );

  const LIST_TITLES: Record<'comfort' | 'calm' | 'friends' | 'pets', string> = {
    comfort: 'Comfort words',
    calm: 'Something that helps to calm down',
    friends: "A friend's first name",
    pets: "A pet's name",
  };
  const LIST_EXAMPLES: Record<'comfort' | 'calm' | 'friends' | 'pets', string> = {
    comfort: 'e.g. Mom loves you to the moon and back 🌙',
    calm: 'e.g. your blue blanket',
    friends: 'e.g. Noa',
    pets: 'e.g. Bobby',
  };

  /** What happens when the grown-up presses OK in a text box. */
  const save = (text: string) => {
    if (!editing) {
      return;
    }
    const isName = editing.kind === 'nickname' || (editing.kind === 'list' && (editing.list === 'friends' || editing.list === 'pets')) || editing.kind === 'newTopic';
    const problem = checkGrownUpText(text, isName ? LIMITS.name : LIMITS.text);
    if (problem) {
      setEditError(problem);
      return;
    }
    const clean = text.trim();
    if (editing.kind === 'nickname') {
      setNotebook({ nickname: clean });
    } else if (editing.kind === 'list') {
      setNotebook({ [editing.list]: [...nb[editing.list], clean] });
    } else if (editing.kind === 'newTopic') {
      const id = `my-${Date.now().toString(36)}`;
      setNotebook({ myTopics: [...nb.myTopics, { id, name: clean, icon: '⭐', facts: [] }] });
    } else if (editing.kind === 'topicIcon') {
      const icon = clean.slice(0, 8);
      setNotebook({ myTopics: nb.myTopics.map(t => (t.id === editing.topicId ? { ...t, icon } : t)) });
    } else if (editing.kind === 'fact') {
      setNotebook({ myTopics: nb.myTopics.map(t => (t.id === editing.topicId ? { ...t, facts: [...t.facts, clean] } : t)) });
    }
    setEditing(null);
    setEditError(null);
  };

  const modal = (() => {
    if (!editing) {
      return { title: '', placeholder: '', initial: '', suggestions: undefined as string[] | undefined };
    }
    switch (editing.kind) {
      case 'nickname':
        return { title: `What should ${buddyName} call your child?`, placeholder: 'e.g. Mia', initial: nb.nickname, suggestions: undefined };
      case 'list':
        return { title: LIST_TITLES[editing.list], placeholder: LIST_EXAMPLES[editing.list], initial: '', suggestions: undefined };
      case 'newTopic':
        return { title: 'A topic your child loves', placeholder: 'e.g. Horses', initial: '', suggestions: undefined };
      case 'topicIcon':
        return { title: 'Pick an emoji (or type one)', placeholder: '⭐', initial: '', suggestions: ICONS };
      case 'fact':
        return { title: `A fact ${buddyName} can tell (short and true)`, placeholder: 'e.g. Horses can sleep standing up.', initial: '', suggestions: undefined };
    }
  })();

  return (
    <View style={styles.screen}>
      {top}
      <ScrollView contentContainerStyle={styles.content}>
        {onOff('🐾 Buddy time', `Talking with buttons, games, adventures and “Help me” tips with ${buddyName}.`, 'enabled')}
        {onOff(
          '✏️ Open talk (typing)',
          `When ON, ${child} can type anything to ${buddyName}. ${buddyName} is NOT an AI: it only answers with sentences written in the app (buddy.json) and by you below, and it never goes on the internet.`,
          'typing',
        )}

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>🔒 Privacy and safety</AppText>
          <AppText style={styles.cardText}>• What {child} says to {buddyName} is never saved and never sent anywhere. It is forgotten when the chat closes.</AppText>
          <AppText style={styles.cardText}>
            • Only if {child} tells {buddyName} something worrying (someone hurting them, unsafe touching, wanting to hurt themselves, danger, a stranger online, a bad secret), {buddyName} tells {child} kindly, and sends that ONE message to you
            {schools.length > 0 ? ` and to the teacher at ${schools.join(', ')}` : ' (and the teacher of their school group, if they are in one)'}. You see it in the Grown-up corner and on your parent page. It is never sent to anyone else, and never to an AI company.
          </AppText>
          <AppText style={[styles.status, friendsOn ? styles.statusOn : styles.statusOff]}>
            {friendsOn
              ? '✅ Worry alerts can reach you.'
              : `⚠️ Friends is off on this phone, so ${buddyName} can't reach you. It shows ${child} a “Show this to a grown-up” card instead. Turn on Friends to get worry alerts.`}
          </AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>🧠 Teach {buddyName}</AppText>
          <AppText style={styles.cardText}>Saved only on this phone. {buddyName} uses these in its chats.</AppText>

          <View style={styles.sub}>
            <AppText style={styles.subTitle}>{buddyName} calls your child: “{child}”</AppText>
            <KidButton label="Change the name" variant="soft" onPress={() => setEditing({ kind: 'nickname' })} style={styles.darkSoft} />
          </View>

          <View style={styles.sub}>
            <AppText style={styles.subTitle}>Things {child} loves</AppText>
            <AppText style={styles.cardText}>{buddyName} talks about them more, and shares fun facts.</AppText>
            <View style={styles.chips}>
              {BUDDY.topics.map(t => {
                const on = nb.loves.includes(t.id);
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setNotebook({ loves: on ? nb.loves.filter(id => id !== t.id) : [...nb.loves, t.id] })}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={t.title}
                    style={[styles.chip, on && styles.chipOn]}>
                    <AppText style={[styles.chipText, on && styles.chipTextOn]}>
                      {on ? '✓ ' : ''}
                      {t.icon} {t.title}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.sub}>
            <AppText style={styles.subTitle}>Your own topics</AppText>
            <AppText style={styles.cardText}>Something else {child} loves? Add it with a few short, true facts.</AppText>
            {nb.myTopics.map(t => (
              <View key={t.id} style={styles.topic}>
                <View style={styles.row}>
                  <Pressable onPress={() => setEditing({ kind: 'topicIcon', topicId: t.id })} accessibilityRole="button" accessibilityLabel="Change the emoji" style={styles.topicIcon}>
                    <AppText style={styles.topicIconText}>{t.icon}</AppText>
                  </Pressable>
                  <AppText style={[styles.subTitle, styles.flex]}>{t.name}</AppText>
                  <Pressable
                    onPress={() => setNotebook({ myTopics: nb.myTopics.filter(x => x.id !== t.id) })}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${t.name}`}
                    style={styles.remove}>
                    <AppText style={styles.removeText}>✕</AppText>
                  </Pressable>
                </View>
                {t.facts.length === 0 ? <AppText style={styles.cardText}>No facts yet. {buddyName} needs at least one.</AppText> : null}
                {t.facts.map((fact, i) => (
                  <View key={`${fact}-${i}`} style={styles.item}>
                    <AppText style={styles.itemText}>• {fact}</AppText>
                    <Pressable
                      onPress={() =>
                        setNotebook({ myTopics: nb.myTopics.map(x => (x.id === t.id ? { ...x, facts: x.facts.filter((_, j) => j !== i) } : x)) })
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Remove this fact"
                      style={styles.remove}>
                      <AppText style={styles.removeText}>✕</AppText>
                    </Pressable>
                  </View>
                ))}
                {t.facts.length < LIMITS.facts ? (
                  <KidButton label="+ Add a fact" variant="soft" onPress={() => setEditing({ kind: 'fact', topicId: t.id })} style={styles.darkSoft} />
                ) : null}
              </View>
            ))}
            {nb.myTopics.length < LIMITS.topics ? (
              <KidButton label="+ Add a topic" variant="soft" onPress={() => setEditing({ kind: 'newTopic' })} style={styles.darkSoft} />
            ) : null}
          </View>

          {listCard('comfort', '💜 Comfort words', `${buddyName} says these when ${child} feels sad, scared or angry: “Your grown-up asked me to tell you: …”`, '+ Add comfort words')}
          {listCard('calm', '🧸 Things that help to calm down', `${buddyName} reminds ${child} of these in hard moments.`, '+ Add a calm-down thing')}
          {listCard('friends', '👫 Friends', `First names only. ${buddyName} encourages playing with them in real life.`, '+ Add a friend')}
          {listCard('pets', '🐾 Pets', `${buddyName} asks how they are.`, '+ Add a pet')}
        </View>

        <KidButton label="Done ✅" onPress={onBack} />
      </ScrollView>

      <TextEntryModal
        visible={!!editing}
        title={modal.title}
        placeholder={modal.placeholder}
        initialValue={modal.initial}
        suggestions={modal.suggestions}
        maxLength={editing?.kind === 'nickname' || editing?.kind === 'newTopic' ? LIMITS.name : LIMITS.text}
        doneLabel="OK"
        error={editError}
        onCancel={() => {
          setEditing(null);
          setEditError(null);
        }}
        onDone={save}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
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
  soft: {
    color: colors.textSoft,
    textAlign: 'center',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.35,
  },
  cardText: {
    color: colors.textDark,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.45,
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
  status: {
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.45,
  },
  statusOn: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  statusOff: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  sub: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderColor: '#E4D4FB',
    paddingTop: spacing.sm,
  },
  subTitle: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.35,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: colors.leafNext,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.leafNext,
  },
  chipText: {
    color: colors.leafNext,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  chipTextOn: {
    color: colors.textLight,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemText: {
    flex: 1,
    color: colors.textDark,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.45,
  },
  remove: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  removeText: {
    color: colors.leafNext,
    fontFamily: fonts.bold,
  },
  topic: {
    gap: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  topicIconText: {
    fontSize: 26,
    lineHeight: 32,
  },
});
