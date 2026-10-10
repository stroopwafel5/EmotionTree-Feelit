/**
 * AdventurePlayer.tsx
 * --------------------------------------------------------------------------
 * Plays one space buddy adventure (models/Adventure.ts, adventures.json)
 * as a chat: the buddy and the story characters talk, the child answers
 * with big buttons (or their own words, when a grown-up turned on typing).
 *
 *  - A good answer on the first try: +1 🍬
 *  - Another answer: a kind reply, and the child can try again
 *  - The end: +5 🍬, and it counts as a weekly homework mission
 *
 * Typed words are checked for worrying things first (exactly like in the
 * buddy talk), and are never saved.
 */
import React, { useMemo, useRef, useState } from 'react';

import BuddyChatView, { type Bubble, type ChatButton } from '../../components/buddy/BuddyChatView';
import ShowGrownUpCard from '../../components/buddy/ShowGrownUpCard';
import CandyCounter from '../../components/rewards/CandyCounter';
import TopBar from '../../components/TopBar';
import feelingsJson from '../../data/feelings.json';
import {
  chooseResult,
  feelingResult,
  firstStep,
  stepById,
  stepKind,
  storyLines,
  wordsResult,
  type AdventureJson,
  type StepJson,
} from '../../models/Adventure';
import { BuddyBrain, friendlyName, type BuddyNotebook, type Turn, type Worry } from '../../models/BuddyBrain';
import { findWorry, hasPrivateInfo } from '../../models/buddyWords';
import { CANDIES } from '../../models/Rewards';
import type { User } from '../../models/User';

interface AdventurePlayerProps {
  adventure: AdventureJson;
  user: User;
  notebook: BuddyNotebook;
  typing: boolean;
  alertWho: string | null;
  /** The child's space candies (shown at the top). */
  candies: number;
  /** A good answer on the first try (+1 candy). */
  onGoodAnswer: () => void;
  /** The adventure is finished (+bonus candies, one weekly mission). */
  onFinished: () => void;
  onWorry: (worry: Worry) => Promise<boolean>;
  onBack: () => void;
}

export default function AdventurePlayer({
  adventure,
  user,
  notebook,
  typing,
  alertWho,
  candies: allCandies,
  onGoodAnswer,
  onFinished,
  onWorry,
  onBack,
}: AdventurePlayerProps) {
  const nextId = useRef(1);
  const names = { name: notebook.nickname || friendlyName(user.username), buddy: user.pet.name };
  // Only used to answer worrying typed words, exactly like the buddy talk.
  const brain = useMemo(
    () => new BuddyBrain({ childName: user.username, buddyName: user.pet.name, feeling: user.feeling, notebook, missionsLeft: 0, alertWho, typing }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** The bubbles of a step (its picture and its lines). */
  const stepBubbles = (step: StepJson): Bubble[] => [
    ...(step.scene ? [{ id: nextId.current++, from: 'scene' as const, text: step.scene }] : []),
    ...storyLines(adventure, step.say, names).map(l => ({
      id: nextId.current++,
      from: l.by === 'cast' ? ('cast' as const) : ('buddy' as const),
      text: l.text,
      name: l.name,
      icon: l.icon,
    })),
  ];

  const start = firstStep(adventure);
  const [step, setStep] = useState<StepJson>(start);
  const titleBubble = (): Bubble => ({ id: nextId.current++, from: 'note', text: `${adventure.icon} ${adventure.title}` });
  const [bubbles, setBubbles] = useState<Bubble[]>(() => [titleBubble(), ...stepBubbles(start)]);
  const [mood, setMood] = useState(start.mood ?? 'happy');
  const [tried, setTried] = useState(false);
  const [candies, setCandies] = useState(0);
  const [card, setCard] = useState(false);
  const [round, setRound] = useState(0);

  const add = (more: Bubble[]) => setBubbles(old => [...old, ...more]);
  const me = (text: string) => add([{ id: nextId.current++, from: 'me', text }]);
  const buddy = (text: string) => add([{ id: nextId.current++, from: 'buddy', text: fill(text) }]);
  const note = (text: string) => add([{ id: nextId.current++, from: 'note', text }]);
  const fill = (text: string) => text.replace(/\{name\}/g, names.name).replace(/\{buddy\}/g, names.buddy);

  const goTo = (id: string | null | undefined) => {
    const next = stepById(adventure, id ?? undefined);
    if (!next) {
      return;
    }
    setStep(next);
    setTried(false);
    setMood(next.mood ?? 'happy');
    add(stepBubbles(next));
    if (next.end) {
      onFinished();
      note(`🎉 Adventure done! +${CANDIES.finishAdventure} 🍬`);
      setCandies(c => c + CANDIES.finishAdventure);
    }
  };

  const good = () => {
    if (!tried) {
      onGoodAnswer();
      setCandies(c => c + CANDIES.rightAnswer);
      note(`+${CANDIES.rightAnswer} 🍬`);
    }
  };

  /** The buddy's answer to something worrying or private (from the buddy brain). */
  const applyTurn = (turn: Turn) => {
    setMood(turn.mood);
    add(turn.lines.map(text => ({ id: nextId.current++, from: 'buddy' as const, text })));
    if (turn.showCard) {
      setCard(true);
    }
    if (turn.sendWorry) {
      onWorry(turn.sendWorry)
        .catch(() => false)
        .then(ok => applyTurn(brain.worrySent(ok)));
    }
  };

  const answerWords = (text: string) => {
    me(text);
    if (findWorry(text) || hasPrivateInfo(text)) {
      applyTurn(brain.hear(text));
      return;
    }
    const result = wordsResult(step, text);
    buddy(result.reply);
    if (result.again) {
      setTried(true);
      setMood('sad');
      return;
    }
    if (result.good) {
      good();
      setMood('grin');
    }
    goTo(step.next);
  };

  const restart = () => {
    nextId.current = 1;
    setRound(r => r + 1);
    setStep(start);
    setBubbles([titleBubble(), ...stepBubbles(start)]);
    setMood(start.mood ?? 'happy');
    setTried(false);
    setCandies(0);
  };

  // ---- the buttons for this step ----
  let buttons: ChatButton[] = [];
  const kind = stepKind(step);
  if (kind === 'talk') {
    buttons = [{ label: step.nextLabel ?? 'Next ➜', onPress: () => goTo(step.next), accent: true }];
  } else if (kind === 'choice') {
    buttons = (step.choices ?? []).map(choice => ({
      label: choice.text,
      onPress: () => {
        me(choice.text);
        const result = chooseResult(step, choice);
        buddy(result.reply);
        if (result.good) {
          good();
          setMood('grin');
          goTo(result.next);
        } else {
          setTried(true);
          setMood('happy');
        }
      },
    }));
  } else if (kind === 'words') {
    buttons = (step.ideas ?? []).map(idea => ({ label: `💬 ${idea}`, onPress: () => answerWords(idea) }));
  } else if (kind === 'feelings') {
    buttons = feelingsJson.feelings.map(f => ({
      label: `${f.emoji} ${f.name}`,
      onPress: () => {
        me(`${f.emoji} ${f.name}`);
        buddy(feelingResult(step, f.id));
        goTo(step.next);
      },
    }));
  } else {
    buttons = [
      { label: 'Play again 🔁', onPress: restart },
      { label: 'More adventures 🗺️', onPress: onBack, accent: true },
    ];
  }

  return (
    <>
      <BuddyChatView
        key={round}
        header={<TopBar title={`${adventure.icon} ${adventure.title}`} onBack={onBack} backLabel="← Back" backHint="Back to the adventures" right={<CandyCounter candies={allCandies} />} />}
        pet={user.pet}
        ownerFeeling={user.feeling}
        mood={mood}
        bubbles={bubbles}
        buttons={buttons}
        compact
        typing={kind === 'words' && typing ? { title: step.say[step.say.length - 1] ?? 'Your words', onSend: answerWords, suggestions: step.ideas } : null}
        note={kind === 'end' ? `You got ${candies} 🍬 in this adventure!` : null}
      />
      <ShowGrownUpCard visible={card} onClose={() => setCard(false)} />
    </>
  );
}
