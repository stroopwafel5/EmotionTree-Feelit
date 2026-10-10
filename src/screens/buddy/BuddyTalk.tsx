/**
 * BuddyTalk.tsx
 * --------------------------------------------------------------------------
 * Talking with the space buddy (and the "Help me with…" tips, which are a
 * chat too).
 *
 * - The child taps big answer buttons. When a grown-up turned on OPEN TALK
 *   (Buddy settings), the child can also type anything (✏️ Type).
 * - The buddy's answers come from models/BuddyBrain.ts (buddy.json + what
 *   the grown-up taught it). It is not an AI and never goes online.
 * - The chat is only kept in this screen's memory. Leaving the screen
 *   forgets it.
 * - A worrying message: the buddy tells the child kindly, and `onWorry`
 *   sends THAT ONE message to the grown-up and teacher (worryAlerts.ts).
 */
import React, { useMemo, useRef, useState } from 'react';

import BuddyChatView, { type Bubble } from '../../components/buddy/BuddyChatView';
import ShowGrownUpCard from '../../components/buddy/ShowGrownUpCard';
import TopBar from '../../components/TopBar';
import { BuddyBrain, type BuddyNotebook, type Chip, type Turn, type Worry } from '../../models/BuddyBrain';
import type { User } from '../../models/User';

/** "go" values the SCREENS handle (the brain handles the others). */
export function isScreenGo(go: string): boolean {
  return ['games', 'adventures', 'help', 'bye'].includes(go) || go.startsWith('adventure:');
}

interface BuddyTalkProps {
  user: User;
  notebook: BuddyNotebook;
  /** Open talk: can the child type? */
  typing: boolean;
  missionsLeft: number;
  /** "your grown-up and your teacher", or null when Friends is off. */
  alertWho: string | null;
  /** Start with the tips of this "Help me with…" topic (instead of hello). */
  helpId?: string;
  /** Sends a worrying message to the grown-up + teacher. true = it arrived. */
  onWorry: (worry: Worry) => Promise<boolean>;
  /** Open games / adventures / help / an adventure, or "bye". */
  onGo: (go: string) => void;
  onBack: () => void;
}

export default function BuddyTalk({ user, notebook, typing, missionsLeft, alertWho, helpId, onWorry, onGo, onBack }: BuddyTalkProps) {
  const nextId = useRef(1);
  const brain = useMemo(
    () =>
      new BuddyBrain({
        childName: user.username,
        buddyName: user.pet.name,
        feeling: user.feeling,
        notebook,
        missionsLeft,
        alertWho,
        typing,
      }),
    // A new brain only when the chat opens (it forgets everything when closed).
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const toBubbles = (lines: string[], from: Bubble['from']): Bubble[] =>
    lines.map(text => ({ id: nextId.current++, from, text }));

  const first = useMemo<Turn>(() => (helpId ? brain.help(helpId) : brain.hello()), [brain, helpId]);
  const [bubbles, setBubbles] = useState<Bubble[]>(() => toBubbles(first.lines, 'buddy'));
  const [mood, setMood] = useState(first.mood);
  const [chips, setChips] = useState<Chip[]>(first.chips);
  const [card, setCard] = useState(!!first.showCard);

  const apply = (turn: Turn) => {
    setMood(turn.mood);
    setBubbles(old => [...old, ...toBubbles(turn.lines, 'buddy')]);
    setChips(turn.chips);
    if (turn.showCard) {
      setCard(true);
    }
    if (turn.sendWorry) {
      const worry = turn.sendWorry;
      onWorry(worry)
        .catch(() => false)
        .then(ok => apply(brain.worrySent(ok)));
    }
    if (turn.go) {
      const go = turn.go;
      setTimeout(() => onGo(go), 700);
    }
  };

  const say = (text: string) => setBubbles(old => [...old, ...toBubbles([text], 'me')]);

  const tap = (c: Chip) => {
    if (c.go === 'showCard') {
      setCard(true);
      return;
    }
    if (c.go && isScreenGo(c.go)) {
      onGo(c.go);
      return;
    }
    say(c.label);
    if (c.go === 'said') {
      apply(brain.said(c.send));
    } else if (c.go) {
      apply(brain.go(c.go));
    } else {
      apply(brain.hear(c.send));
    }
  };

  const send = (text: string) => {
    say(text);
    apply(brain.hear(text));
  };

  return (
    <>
      <BuddyChatView
        header={<TopBar title={helpId ? '💡 Help me' : `💬 ${user.pet.name}`} onBack={onBack} backLabel="← Back" backHint="Go back" />}
        pet={user.pet}
        ownerFeeling={user.feeling}
        mood={mood}
        bubbles={bubbles}
        buttons={chips.map(c => ({ label: c.label, onPress: () => tap(c), accent: !!c.go && c.go !== 'said' }))}
        typing={typing ? { title: `Talk to ${user.pet.name}`, onSend: send, suggestions: ['I feel happy', 'Tell me a joke', 'Can I tell you something?'] } : null}
        note={typing ? null : `✏️ Typing to ${user.pet.name} is off. A grown-up can turn it on in Buddy settings.`}
      />
      <ShowGrownUpCard visible={card} onClose={() => setCard(false)} />
    </>
  );
}
