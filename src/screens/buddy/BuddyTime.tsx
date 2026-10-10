/**
 * BuddyTime.tsx
 * --------------------------------------------------------------------------
 * "Buddy time": everything the child can do with their space buddy.
 *
 *   hub         the buddy says hi; 4 big buttons:
 *   ├─ 💬 Talk         chat with the buddy (BuddyTalk)
 *   ├─ 🗺️ Adventures   stories to practise the feelings leaves (AdventurePlayer)
 *   ├─ 🎲 Games        guess my face, kind or not kind... (BuddyGames)
 *   └─ 💡 Help me      tips for tricky moments: joining a game, too loud...
 *
 * A grown-up can turn buddy time off, and turns OPEN TALK (typing) on, in
 * Buddy settings. Nothing the child says here is saved. Only a worrying
 * message is sent - to the grown-up and teacher, see worryAlerts.ts.
 */
import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../../components/AppText';
import BuddyAvatar from '../../components/avatar/BuddyAvatar';
import KidButton from '../../components/KidButton';
import CandyCounter from '../../components/rewards/CandyCounter';
import TopBar from '../../components/TopBar';
import { ADVENTURES, isUnlocked, type AdventureJson } from '../../models/Adventure';
import { BUDDY, friendlyName, type Worry } from '../../models/BuddyBrain';
import type { User } from '../../models/User';
import type { BuddySaved } from '../../services/buddyService';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';
import AdventurePlayer from './AdventurePlayer';
import { BuddyGame, GameList, type GameId } from './BuddyGames';
import BuddyTalk from './BuddyTalk';

type Sub =
  | { v: 'hub' }
  | { v: 'talk'; helpId?: string }
  | { v: 'adventures' }
  | { v: 'adventure'; id: string }
  | { v: 'games' }
  | { v: 'game'; id: GameId }
  | { v: 'help' };

/** A leaf, for "finish the Sadness leaf first". */
export interface LeafInfo {
  id: number;
  name: string;
  icon: string;
  done: boolean;
}

interface BuddyTimeProps {
  user: User;
  buddy: BuddySaved;
  leaves: LeafInfo[];
  candies: number;
  missionsLeft: number;
  alertWho: string | null;
  onWorry: (worry: Worry) => Promise<boolean>;
  /** A right answer in a game / adventure (+1 candy). */
  onCandy: () => void;
  /** An adventure was finished (bonus + weekly mission). */
  onAdventureDone: () => void;
  onHome: () => void;
}

export default function BuddyTime({ user, buddy, leaves, candies, missionsLeft, alertWho, onWorry, onCandy, onAdventureDone, onHome }: BuddyTimeProps) {
  const [sub, setSub] = useState<Sub>({ v: 'hub' });
  const [locked, setLocked] = useState<string | null>(null);
  const pet = user.pet;
  const { settings, notebook } = buddy;
  const finished = leaves.filter(l => l.done).map(l => l.id);

  const back = () => {
    if (sub.v === 'hub') {
      onHome();
    } else if (sub.v === 'adventure') {
      setSub({ v: 'adventures' });
    } else if (sub.v === 'game') {
      setSub({ v: 'games' });
    } else if (sub.v === 'talk' && sub.helpId) {
      setSub({ v: 'help' });
    } else {
      setSub({ v: 'hub' });
    }
  };

  // Android back button: one step back inside buddy time.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => subscription.remove();
  });

  /** Why an adventure is still locked ("Finish the Sadness 😢 leaf first."). */
  const lockText = (adv: AdventureJson) => {
    const missing = adv.needsLeaves.filter(id => !finished.includes(id)).map(id => leaves.find(l => l.id === id));
    const names = missing.map(l => (l ? `${l.name} ${l.icon}` : '?')).join(' and the ');
    return `Finish the ${names} leaf first. Then we can practise it together!`;
  };

  /** Opens what a button in the chat asks for. */
  const open = (go: string) => {
    if (go === 'games') {
      setSub({ v: 'games' });
    } else if (go === 'adventures') {
      setSub({ v: 'adventures' });
    } else if (go === 'help') {
      setSub({ v: 'help' });
    } else if (go === 'bye') {
      setSub({ v: 'hub' });
    } else if (go.startsWith('adventure:')) {
      const adv = ADVENTURES.find(a => a.id === go.slice(10));
      if (adv && isUnlocked(adv, finished)) {
        setSub({ v: 'adventure', id: adv.id });
      } else {
        setSub({ v: 'adventures' });
        setLocked(adv ? lockText(adv) : null);
      }
    }
  };

  const top = (title: string) => (
    <TopBar title={title} onBack={back} backLabel={sub.v === 'hub' ? '🏠 Home' : '← Back'} backHint="Go back" right={<CandyCounter candies={candies} />} />
  );

  // ---- Turned off by a grown-up ----
  if (!settings.enabled) {
    return (
      <View style={styles.screen}>
        {top(`🐾 ${pet.name}`)}
        <View style={styles.center}>
          <BuddyAvatar pet={pet} mood="sleepy" size={160} />
          <AppText style={styles.title}>{pet.name} is resting now. 😴</AppText>
          <AppText style={styles.text}>Your grown-up turned buddy time off for now.</AppText>
          <KidButton label="Back home 🏠" onPress={onHome} />
        </View>
      </View>
    );
  }

  // ---- Talk / help tips ----
  if (sub.v === 'talk') {
    return (
      <BuddyTalk
        key={sub.helpId ?? 'talk'}
        user={user}
        notebook={notebook}
        typing={settings.typing}
        missionsLeft={missionsLeft}
        alertWho={alertWho}
        helpId={sub.helpId}
        onWorry={onWorry}
        onGo={open}
        onBack={back}
      />
    );
  }

  // ---- One adventure ----
  if (sub.v === 'adventure') {
    const adventure = ADVENTURES.find(a => a.id === sub.id);
    if (adventure) {
      return (
        <AdventurePlayer
          key={adventure.id}
          adventure={adventure}
          user={user}
          notebook={notebook}
          typing={settings.typing}
          alertWho={alertWho}
          candies={candies}
          onGoodAnswer={onCandy}
          onFinished={onAdventureDone}
          onWorry={onWorry}
          onBack={back}
        />
      );
    }
  }

  // ---- Games ----
  if (sub.v === 'games') {
    return <GameList user={user} onPick={id => setSub({ v: 'game', id })} onBack={back} />;
  }
  if (sub.v === 'game') {
    return <BuddyGame game={sub.id} user={user} candies={candies} onCandy={onCandy} onBack={back} />;
  }

  // ---- The list of adventures ----
  if (sub.v === 'adventures') {
    return (
      <View style={styles.screen}>
        {top('🗺️ Adventures')}
        <ScrollView contentContainerStyle={styles.list}>
          <AppText style={styles.intro}>Go on an adventure with {pet.name} and practise what you learned! 🍬 An adventure also counts for your weekly homework.</AppText>
          {locked ? (
            <View style={styles.lockedNote}>
              <AppText style={styles.lockedNoteText}>🔒 {locked}</AppText>
            </View>
          ) : null}
          {ADVENTURES.map(adv => {
            const unlocked = isUnlocked(adv, finished);
            const practises = adv.practices.map(id => leaves.find(l => l.id === id)).filter(Boolean) as LeafInfo[];
            return (
              <Pressable
                key={adv.id}
                onPress={() => (unlocked ? setSub({ v: 'adventure', id: adv.id }) : setLocked(lockText(adv)))}
                accessibilityRole="button"
                accessibilityLabel={`${adv.title}. ${unlocked ? adv.about : lockText(adv)}`}
                style={({ pressed }) => [styles.advCard, !unlocked && styles.advLocked, pressed && styles.pressed]}>
                <AppText style={styles.advIcon}>{unlocked ? adv.icon : '🔒'}</AppText>
                <View style={styles.flex}>
                  <AppText style={styles.advTitle}>{adv.title}</AppText>
                  <AppText style={styles.advAbout}>{unlocked ? adv.about : lockText(adv)}</AppText>
                  <AppText style={styles.advPractice}>Practise: {practises.map(l => `${l.icon} ${l.name}`).join(' · ')}</AppText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ---- "Help me with…" ----
  if (sub.v === 'help') {
    return (
      <View style={styles.screen}>
        {top('💡 Help me with…')}
        <ScrollView contentContainerStyle={styles.list}>
          <AppText style={styles.intro}>Tricky moment? Pick one, and {pet.name} gives you tips and things you can say.</AppText>
          <View style={styles.helpGrid}>
            {BUDDY.help.map(h => (
              <Pressable
                key={h.id}
                onPress={() => setSub({ v: 'talk', helpId: h.id })}
                accessibilityRole="button"
                accessibilityLabel={h.title}
                style={({ pressed }) => [styles.helpTile, pressed && styles.pressed]}>
                <AppText style={styles.helpIcon}>{h.icon}</AppText>
                <AppText style={styles.helpTitle}>{h.title}</AppText>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---- The hub ----
  const name = notebook.nickname || friendlyName(user.username);
  const tiles: { icon: string; label: string; go: () => void; hint: string }[] = [
    { icon: '💬', label: 'Talk', go: () => setSub({ v: 'talk' }), hint: `Talk with ${pet.name}` },
    { icon: '🗺️', label: 'Adventures', go: () => setSub({ v: 'adventures' }), hint: 'Go on an adventure' },
    { icon: '🎲', label: 'Games', go: () => setSub({ v: 'games' }), hint: 'Play games' },
    { icon: '💡', label: 'Help me', go: () => setSub({ v: 'help' }), hint: 'Tips for tricky moments' },
  ];
  return (
    <View style={styles.screen}>
      {top(`🐾 ${pet.name}`)}
      <ScrollView contentContainerStyle={styles.hub}>
        <View style={styles.hello}>
          <BuddyAvatar pet={pet} ownerFeeling={user.feeling} mood="grin" size={150} />
          <View style={styles.helloBubble}>
            <AppText style={styles.helloText}>Hi {name}! 👋 What do you want to do?</AppText>
            {missionsLeft > 0 ? (
              <AppText style={styles.helloSmall}>Psst! An adventure counts for your weekly homework. 🗺️</AppText>
            ) : null}
          </View>
        </View>
        <View style={styles.grid}>
          {tiles.map(t => (
            <Pressable
              key={t.label}
              onPress={t.go}
              accessibilityRole="button"
              accessibilityLabel={t.hint}
              style={({ pressed }) => [styles.bigTile, pressed && styles.pressed]}>
              <AppText style={styles.bigIcon}>{t.icon}</AppText>
              <AppText style={styles.bigLabel}>{t.label}</AppText>
            </Pressable>
          ))}
        </View>
        <AppText style={styles.privacy}>
          🔒 What you tell {pet.name} stays on this phone, and {pet.name} forgets it when you leave.
          {alertWho ? ` Only if you are not safe, ${pet.name} tells ${alertWho}.` : ''}
        </AppText>
      </ScrollView>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
    textAlign: 'center',
  },
  text: {
    color: colors.textSoft,
    textAlign: 'center',
  },
  hub: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  hello: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  helloBubble: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignSelf: 'stretch',
  },
  helloText: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
    textAlign: 'center',
  },
  helloSmall: {
    color: colors.textDark,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  bigTile: {
    width: 160,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.spacePanel,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    gap: spacing.xs,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  bigIcon: {
    fontSize: 48,
    lineHeight: 60,
  },
  bigLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  privacy: {
    color: colors.textSoft,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.45,
    textAlign: 'center',
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  intro: {
    color: colors.textSoft,
    textAlign: 'center',
  },
  lockedNote: {
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  lockedNoteText: {
    color: '#92400E',
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
  advCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: '#E4D4FB',
    padding: spacing.md,
  },
  advLocked: {
    opacity: 0.75,
    backgroundColor: '#E5E7EB',
  },
  advIcon: {
    fontSize: 44,
    lineHeight: 56,
  },
  advTitle: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  advAbout: {
    color: colors.textDark,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  advPractice: {
    color: colors.leafNext,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.4,
    marginTop: spacing.xs,
  },
  helpGrid: {
    gap: spacing.sm,
  },
  helpTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 64,
  },
  helpIcon: {
    fontSize: 32,
    lineHeight: 40,
  },
  helpTitle: {
    flex: 1,
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.35,
  },
});
