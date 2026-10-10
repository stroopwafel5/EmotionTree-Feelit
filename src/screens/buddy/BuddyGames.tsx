/**
 * BuddyGames.tsx
 * --------------------------------------------------------------------------
 * Games with the space buddy (the rounds are in buddy.json "games"):
 *
 *   🎭 Guess my face        the buddy makes a face, the child names the feeling
 *   💜 Kind or not kind?    is this sentence kind?
 *   🤔 Would you rather     pick one, then practise asking back "What about you?"
 *   💬 What would you say?  real-life moments: what could you say?
 *
 * +1 🍬 for a right answer on the first try (and for asking back).
 * Wrong answers get a kind hint, never a telling-off.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../../components/AppText';
import BuddyChatView, { type Bubble, type ChatButton } from '../../components/buddy/BuddyChatView';
import CandyCounter from '../../components/rewards/CandyCounter';
import TopBar from '../../components/TopBar';
import buddyJson from '../../data/buddy.json';
import type { User } from '../../models/User';
import { shuffle } from '../../services/testBuilder';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';

interface FaceRound {
  mood: string;
  answer: string;
  choices: string[];
  hint: string;
}
interface KindRound {
  text: string;
  kind: boolean;
  why: string;
}
interface RatherRound {
  a: string;
  b: string;
  buddy: 'a' | 'b';
  why: string;
}
interface SayRound {
  icon: string;
  situation: string;
  options: { text: string; kind: 'great' | 'ok' | 'unkind'; reply: string }[];
}
interface Games {
  faces: { title: string; icon: string; about: string; ask: string[]; right: string[]; wrong: string[]; rounds: FaceRound[] };
  kindOrNot: { title: string; icon: string; about: string; ask: string[]; kindLabel: string; notKindLabel: string; right: string[]; wrong: string[]; rounds: KindRound[] };
  wouldYouRather: { title: string; icon: string; about: string; ask: string[]; picked: string[]; askBack: string; buddyPick: string[]; praise: string[]; rounds: RatherRound[] };
  whatWouldYouSay: { title: string; icon: string; about: string; ask: string[]; rounds: SayRound[] };
}
export type GameId = keyof Games;

const GAMES = (buddyJson as unknown as { games: Games }).games;
export const GAME_IDS: GameId[] = ['faces', 'kindOrNot', 'wouldYouRather', 'whatWouldYouSay'];
const ROUNDS: Record<GameId, number> = { faces: 8, kindOrNot: 8, wouldYouRather: 5, whatWouldYouSay: 5 };

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const one = (list: string[]) => list[Math.floor(Math.random() * list.length)];
const fillIn = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? '');

// ===========================================================================
// The list of games
// ===========================================================================

export function GameList({ user, onPick, onBack }: { user: User; onPick: (id: GameId) => void; onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <TopBar title="🎲 Games" onBack={onBack} backLabel="← Back" backHint="Go back" />
      <ScrollView contentContainerStyle={styles.list}>
        <AppText style={styles.intro}>Play with {user.pet.name}! Right answers give you 🍬 space candies.</AppText>
        {GAME_IDS.map(id => (
          <Pressable
            key={id}
            onPress={() => onPick(id)}
            accessibilityRole="button"
            accessibilityLabel={`${GAMES[id].title}. ${GAMES[id].about}`}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <AppText style={styles.tileIcon}>{GAMES[id].icon}</AppText>
            <View style={styles.tileText}>
              <AppText style={styles.tileTitle}>{GAMES[id].title}</AppText>
              <AppText style={styles.tileAbout}>{GAMES[id].about}</AppText>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ===========================================================================
// One game
// ===========================================================================

interface GameProps {
  game: GameId;
  user: User;
  candies: number;
  /** A right answer on the first try. */
  onCandy: () => void;
  onBack: () => void;
}

export function BuddyGame({ game, user, candies, onCandy, onBack }: GameProps) {
  const [round, setRound] = useState(0);
  return <GameRun key={round} game={game} user={user} candies={candies} onCandy={onCandy} onBack={onBack} onAgain={() => setRound(r => r + 1)} />;
}

function GameRun({ game, user, candies, onCandy, onBack, onAgain }: GameProps & { onAgain: () => void }) {
  const g = GAMES[game];
  const nextId = useRef(1);
  const rounds = useMemo(() => shuffle([...(g.rounds as unknown[])]).slice(0, ROUNDS[game]), [g, game]);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<'ask' | 'answered' | 'askBack' | 'done'>('ask');
  const [tried, setTried] = useState(false);
  const [score, setScore] = useState(0);
  const [mood, setMood] = useState('happy');
  const [picked, setPicked] = useState<string | null>(null);

  const bubble = (from: Bubble['from'], text: string): Bubble => ({ id: nextId.current++, from, text });

  /** The buddy asks round i. */
  const askBubbles = (i: number): Bubble[] => {
    const r = rounds[i] as never;
    if (game === 'faces') {
      return [bubble('note', `${i + 1} of ${rounds.length}`), bubble('buddy', one(g.ask))];
    }
    if (game === 'kindOrNot') {
      return [bubble('note', `${i + 1} of ${rounds.length}`), bubble('buddy', `“${(r as KindRound).text}”`), bubble('buddy', one(g.ask))];
    }
    if (game === 'wouldYouRather') {
      const w = r as RatherRound;
      return [bubble('note', `${i + 1} of ${rounds.length}`), bubble('buddy', `${one(g.ask)} ${lowerFirst(w.a)} or ${lowerFirst(w.b)}?`)];
    }
    const s = r as SayRound;
    return [bubble('note', `${i + 1} of ${rounds.length}`), bubble('scene', s.icon), bubble('buddy', s.situation), bubble('buddy', one(g.ask))];
  };

  // The game's name and what to do, then the first round.
  const [bubbles, setBubbles] = useState<Bubble[]>(() => [bubble('note', `${g.icon} ${g.title}: ${g.about}`), ...askBubbles(0)]);
  const add = (more: Bubble[]) => setBubbles(old => [...old, ...more]);

  const faceMood = game === 'faces' && stage !== 'done' ? (rounds[index] as FaceRound).mood : mood;

  const win = () => {
    if (!tried) {
      onCandy();
      setScore(s => s + 1);
      add([bubble('note', '+1 🍬')]);
    }
  };

  const next = () => {
    const i = index + 1;
    if (i >= rounds.length) {
      setStage('done');
      setMood('grin');
      add([bubble('buddy', `That was fun! 🎉 You got ${score} 🍬 in this game.`)]);
      return;
    }
    setIndex(i);
    setTried(false);
    setPicked(null);
    setStage('ask');
    setMood('happy');
    add(askBubbles(i));
  };

  let buttons: ChatButton[] = [];
  if (stage === 'done') {
    buttons = [
      { label: 'Play again 🔁', onPress: onAgain },
      { label: 'Other games 🎲', onPress: onBack, accent: true },
    ];
  } else if (stage === 'answered') {
    buttons = [{ label: 'Next ➜', onPress: next, accent: true }];
  } else if (game === 'faces') {
    const r = rounds[index] as FaceRound;
    buttons = r.choices.map(choice => ({
      label: choice,
      onPress: () => {
        add([bubble('me', choice)]);
        if (choice === r.answer) {
          add([bubble('buddy', fillIn(one(GAMES.faces.right), { answer: r.answer }))]);
          win();
          setStage('answered');
        } else {
          add([bubble('buddy', fillIn(one(GAMES.faces.wrong), { hint: r.hint }))]);
          setTried(true);
        }
      },
    }));
  } else if (game === 'kindOrNot') {
    const r = rounds[index] as KindRound;
    const answer = (saysKind: boolean) => () => {
      add([bubble('me', saysKind ? GAMES.kindOrNot.kindLabel : GAMES.kindOrNot.notKindLabel)]);
      const right = saysKind === r.kind;
      add([bubble('buddy', `${one(right ? GAMES.kindOrNot.right : GAMES.kindOrNot.wrong)} ${r.why}`)]);
      if (right) {
        win();
      }
      setMood(r.kind ? 'grin' : 'sad');
      setStage('answered');
    };
    buttons = [
      { label: GAMES.kindOrNot.kindLabel, onPress: answer(true) },
      { label: GAMES.kindOrNot.notKindLabel, onPress: answer(false) },
    ];
  } else if (game === 'wouldYouRather') {
    const r = rounds[index] as RatherRound;
    if (stage === 'askBack') {
      buttons = [
        {
          label: GAMES.wouldYouRather.askBack,
          accent: true,
          onPress: () => {
            add([
              bubble('me', GAMES.wouldYouRather.askBack),
              bubble('buddy', fillIn(one(GAMES.wouldYouRather.buddyPick), { choice: lowerFirst(r.buddy === 'a' ? r.a : r.b), why: r.why })),
              bubble('note', one(GAMES.wouldYouRather.praise)),
            ]);
            onCandy();
            setScore(s => s + 1);
            setMood('grin');
            setStage('answered');
          },
        },
      ];
    } else {
      buttons = [r.a, r.b].map(choice => ({
        label: choice,
        onPress: () => {
          setPicked(choice);
          add([bubble('me', choice), bubble('buddy', fillIn(one(GAMES.wouldYouRather.picked), { choice }))]);
          setStage('askBack');
        },
      }));
    }
  } else {
    const r = rounds[index] as SayRound;
    buttons = r.options.map(option => ({
      label: option.text,
      onPress: () => {
        add([bubble('me', option.text), bubble('buddy', option.reply)]);
        if (option.kind === 'great') {
          win();
          setMood('grin');
          setStage('answered');
        } else if (option.kind === 'ok') {
          setTried(true);
          setMood('happy');
          setStage('answered');
        } else {
          setTried(true);
          setMood('sad');
        }
      },
    }));
  }

  return (
    <BuddyChatView
      header={<TopBar title={`${g.icon} ${g.title}`} onBack={onBack} backLabel="← Back" backHint="Back to the games" right={<CandyCounter candies={candies} />} />}
      pet={user.pet}
      ownerFeeling={user.feeling}
      mood={faceMood}
      bubbles={bubbles}
      buttons={buttons}
      compact={game !== 'faces'}
      note={picked && stage === 'askBack' ? 'Tip: good friends ask questions back! 🙋' : null}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: '#E4D4FB',
    padding: spacing.md,
    minHeight: 88,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  tileIcon: {
    fontSize: 44,
    lineHeight: 56,
  },
  tileText: {
    flex: 1,
  },
  tileTitle: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  tileAbout: {
    color: colors.textDark,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
});
