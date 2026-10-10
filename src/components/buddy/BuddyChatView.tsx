/**
 * BuddyChatView.tsx
 * --------------------------------------------------------------------------
 * The chat with the space buddy, used for talking, help tips and
 * adventures:
 *
 *   ┌──────────────────────────────┐
 *   │   (the buddy, big, its face   │  the face changes with what it says
 *   │    changes: smile, sad, wow)  │
 *   ├──────────────────────────────┤
 *   │ 🐾 Hi Mia! How are you?       │  buddy bubbles (left)
 *   │               I'm happy 😊 🧒 │  the child (right)
 *   │ 🤖 Robo: Beep… boop…          │  story characters (yellow)
 *   ├──────────────────────────────┤
 *   │ [Happy 😊] [Sad 😢] [Tired 😴] │  big answer buttons
 *   │ [✏️ Type]                     │  only when a grown-up turned on typing
 *   └──────────────────────────────┘
 *
 * Big buttons mean every child can answer, also children who don't type.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Pet } from '../../models/Pet';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';
import AppText from '../AppText';
import BuddyAvatar from '../avatar/BuddyAvatar';
import TextEntryModal from '../TextEntryModal';

/** One bubble in the chat. */
export interface Bubble {
  id: number;
  from: 'buddy' | 'me' | 'cast' | 'scene' | 'note';
  text: string;
  /** For story characters ("Robo", "🤖"). */
  name?: string;
  icon?: string;
}

export interface ChatButton {
  label: string;
  onPress: () => void;
  /** A button that opens something (games, an adventure...). */
  accent?: boolean;
}

interface BuddyChatViewProps {
  pet: Pet;
  ownerFeeling: string | null;
  /** The buddy's face right now. */
  mood: string;
  bubbles: Bubble[];
  buttons: ChatButton[];
  /** When typing is allowed: what the typing box says, and what happens on Send. */
  typing?: { title: string; suggestions?: string[]; onSend: (text: string) => void } | null;
  /** A small note under the buttons (e.g. "Typing: a grown-up can turn it on"). */
  note?: string | null;
  /** Something above the chat (a TopBar). */
  header: React.ReactNode;
  /** A smaller buddy (for long stories). */
  compact?: boolean;
}

export default function BuddyChatView({
  pet,
  ownerFeeling,
  mood,
  bubbles,
  buttons,
  typing,
  note,
  header,
  compact = false,
}: BuddyChatViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [typingOpen, setTypingOpen] = useState(false);

  // Always show the newest bubbles.
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [bubbles.length]);

  return (
    <View style={styles.screen}>
      {header}
      <View style={styles.stage}>
        <BuddyAvatar pet={pet} ownerFeeling={ownerFeeling} mood={mood} size={compact ? 92 : 120} />
      </View>

      <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={styles.chatContent}>
        {bubbles.map(b => {
          if (b.from === 'scene') {
            return (
              <AppText key={b.id} style={styles.scene} accessibilityLabel="Picture">
                {b.text}
              </AppText>
            );
          }
          if (b.from === 'note') {
            return (
              <AppText key={b.id} style={styles.note}>
                {b.text}
              </AppText>
            );
          }
          const mine = b.from === 'me';
          return (
            <View key={b.id} style={[styles.bubble, mine ? styles.me : b.from === 'cast' ? styles.cast : styles.buddy]}>
              {b.from === 'cast' ? (
                <AppText style={styles.castName}>
                  {b.icon} {b.name}
                </AppText>
              ) : null}
              <AppText style={[styles.bubbleText, mine && styles.meText]}>{b.text}</AppText>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.answers}>
        <ScrollView contentContainerStyle={styles.buttons} style={styles.buttonsScroll}>
          {buttons.map(button => (
            <Pressable
              key={button.label}
              onPress={button.onPress}
              accessibilityRole="button"
              accessibilityLabel={button.label}
              style={({ pressed }) => [styles.button, button.accent && styles.buttonAccent, pressed && styles.pressed]}>
              <AppText style={styles.buttonText}>{button.label}</AppText>
            </Pressable>
          ))}
          {typing ? (
            <Pressable
              onPress={() => setTypingOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Type my own words"
              style={({ pressed }) => [styles.button, styles.typeButton, pressed && styles.pressed]}>
              <AppText style={styles.typeText}>✏️ Type</AppText>
            </Pressable>
          ) : null}
        </ScrollView>
        {note ? <AppText style={styles.smallNote}>{note}</AppText> : null}
      </View>

      {typing ? (
        <TextEntryModal
          visible={typingOpen}
          title={typing.title}
          placeholder="Type here…"
          maxLength={200}
          doneLabel="Send 🚀"
          suggestions={typing.suggestions}
          onCancel={() => setTypingOpen(false)}
          onDone={text => {
            setTypingOpen(false);
            if (text.trim()) {
              typing.onSend(text.trim());
            }
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  stage: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  chat: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  scene: {
    fontSize: 54,
    lineHeight: 70,
    textAlign: 'center',
  },
  note: {
    alignSelf: 'center',
    color: colors.textSoft,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'center',
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buddy: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderTopLeftRadius: 4,
  },
  cast: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderTopLeftRadius: 4,
    marginLeft: spacing.md,
  },
  me: {
    alignSelf: 'flex-end',
    backgroundColor: colors.purpleBright,
    borderWidth: 2,
    borderColor: colors.purpleGlow,
    borderTopRightRadius: 4,
  },
  castName: {
    color: '#92400E',
    fontFamily: fonts.bold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  bubbleText: {
    color: colors.textDark,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.4,
  },
  meText: {
    color: colors.textLight,
  },
  answers: {
    borderTopWidth: 2,
    borderColor: colors.spacePanel,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  buttonsScroll: {
    maxHeight: 230,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  button: {
    minHeight: 52,
    justifyContent: 'center',
    backgroundColor: colors.spacePanel,
    borderWidth: 2,
    borderColor: colors.purpleGlow,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
  },
  buttonAccent: {
    backgroundColor: colors.leafNext,
  },
  typeButton: {
    backgroundColor: colors.card,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  buttonText: {
    color: colors.textLight,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.35,
  },
  typeText: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.35,
  },
  smallNote: {
    color: colors.textSoft,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.4,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
});
