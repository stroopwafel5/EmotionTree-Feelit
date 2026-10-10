/**
 * ChatScreen.tsx
 * --------------------------------------------------------------------------
 * One chat: with my grown-up, with a friend, or in a class group.
 *
 * How a child can "talk" (bottom toolbar, like Club Penguin):
 *   💬 Words    - ready-made phrases (phrases.json). Always on. No reading
 *                 or spelling needed: tap a phrase to send it.
 *   💜 Feelings - send a feeling card ("I feel happy 😊"). Always on.
 *   ⌨️ Type     - typed messages. ONLY when the parents turned it on
 *                 (in a friend chat: BOTH parents). Checked by the safety
 *                 filter on the server.
 *   🎤 Voice    - voice messages. ONLY when the parents turned them on.
 *   Nobody can send pictures - the server only accepts these 4 kinds.
 *
 * With my grown-up, typing and voice are always on.
 *
 * Every message from another child has a 🚩 button: "Tell my grown-up".
 * New messages are fetched every CHAT_REFRESH_MS (see config.ts).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../../components/AppText';
import KidAvatar from '../../components/avatar/KidAvatar';
import { FeelingButton } from '../../components/FeelingPicker';
import KidButton from '../../components/KidButton';
import RoundToolButton from '../../components/RoundToolButton';
import TextEntryModal from '../../components/TextEntryModal';
import TopBar from '../../components/TopBar';
import { CHAT_REFRESH_MS, MAX_VOICE_SECONDS } from '../../config';
import { Look } from '../../models/Look';
import type { UserJson } from '../../models/User';
import { ApiError } from '../../services/api';
import { feelings, getFeeling, phraseCategories, phraseText } from '../../services/feelings';
import {
  friendsService,
  mergeMessages,
  type ChatMessage,
  type OpenChat,
  type SendResult,
} from '../../services/friendsService';
import { askForMicrophone, playVoice, startRecording, stopRecording, stopVoice } from '../../services/voice';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';

interface ChatScreenProps {
  token: string;
  /** The child using the app. */
  me: UserJson;
  chat: OpenChat;
  onBack: () => void;
  /** The child left a group (go back to the friends list). */
  onLeftGroup: () => void;
}

type Panel = 'phrases' | 'feelings' | 'voice' | null;

interface Notice {
  text: string;
  /** 'stop' = the safety filter stopped a message (yellow card). */
  tone: 'stop' | 'info';
}

export default function ChatScreen({ token, me, chat, onBack, onLeftGroup }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allowed, setAllowed] = useState({ freeText: chat.kind === 'parent', voice: chat.kind === 'parent' });
  const [members, setMembers] = useState<UserJson[]>(chat.kind === 'group' ? chat.group.members : []);
  const [loaded, setLoaded] = useState(false);
  const [closed, setClosed] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [typing, setTyping] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sending, setSending] = useState(false);
  const [category, setCategory] = useState(phraseCategories[0]?.id ?? '');
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  const lastIdRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef(false);

  // ---- who is who (for the little avatar heads) ----
  const people = useMemo(() => {
    const map = new Map<number, UserJson>();
    map.set(me.id, me);
    if (chat.kind === 'friend') {
      map.set(chat.friend.id, chat.friend);
    }
    members.forEach(m => map.set(m.id, m));
    return map;
  }, [me, chat, members]);

  // ---- fetching messages ----
  const load = useCallback(async () => {
    try {
      const page = await friendsService.messages(token, chat.ref, lastIdRef.current);
      if (page.messages.length > 0) {
        lastIdRef.current = Math.max(lastIdRef.current, ...page.messages.map(m => m.id));
        setMessages(current => mergeMessages(current, page.messages));
      }
      setAllowed(page.allowed);
      if (page.members) {
        setMembers(page.members);
      }
      setClosed(null);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 403 || e.status === 404)) {
        setClosed(e.message);
      }
      // Other problems (no internet...): just try again next time.
    } finally {
      setLoaded(true);
    }
  }, [token, chat.ref]);

  useEffect(() => {
    load();
    const timer = setInterval(load, CHAT_REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Scroll to the newest message.
  useEffect(() => {
    const frame = requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    return () => cancelAnimationFrame(frame);
  }, [messages.length, panel]);

  // Leaving the chat: stop any sound.
  useEffect(
    () => () => {
      if (recTimer.current) {
        clearInterval(recTimer.current);
      }
      if (recordingRef.current) {
        stopRecording().catch(() => {});
      }
      stopVoice().catch(() => {});
    },
    [],
  );

  // ---- sending ----
  const send = async (action: () => Promise<SendResult>) => {
    setSending(true);
    setNotice(null);
    try {
      const result = await action();
      if ('stopped' in result) {
        setNotice({ text: result.message, tone: 'stop' });
        return false;
      }
      setMessages(current => mergeMessages(current, [result.message]));
      setPanel(null);
      load(); // also picks up anything a friend sent meanwhile
      return true;
    } catch (e) {
      if (!(e instanceof ApiError)) {
        console.warn('Chat: sending failed', e); // shows in the Metro window, for developers
      }
      setNotice({ text: e instanceof ApiError ? e.message : 'Something went wrong. Please try again.', tone: 'info' });
      return false;
    } finally {
      setSending(false);
    }
  };

  const sendPhrase = (phraseId: string) => send(() => friendsService.sendPhrase(token, chat.ref, phraseId));
  const sendFeeling = (feelingId: string) => send(() => friendsService.sendFeeling(token, chat.ref, feelingId));
  const sendText = async (text: string) => {
    const ok = await send(() => friendsService.sendText(token, chat.ref, text));
    // Close the typing box either way; a stopped message is explained below the chat.
    setTyping(false);
    return ok;
  };

  // ---- voice messages ----
  const startRec = async () => {
    setNotice(null);
    if (!(await askForMicrophone())) {
      setNotice({ text: 'The microphone is not allowed. A grown-up can allow it in the phone settings.', tone: 'info' });
      return;
    }
    try {
      await startRecording();
    } catch {
      setNotice({ text: "The microphone didn't start. Please try again.", tone: 'info' });
      return;
    }
    recordingRef.current = true;
    setRecording(true);
    setRecSeconds(0);
    recTimer.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
  };

  const stopRec = useCallback(
    async (sendIt: boolean) => {
      if (!recordingRef.current) {
        return;
      }
      recordingRef.current = false;
      if (recTimer.current) {
        clearInterval(recTimer.current);
        recTimer.current = null;
      }
      setRecording(false);
      try {
        const { uri, seconds } = await stopRecording();
        if (sendIt) {
          await send(() => friendsService.sendVoice(token, chat.ref, uri, seconds));
        }
      } catch {
        setNotice({ text: 'The recording did not work. Please try again.', tone: 'info' });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, chat.ref],
  );

  // Stop by itself at the time limit.
  useEffect(() => {
    if (recording && recSeconds >= MAX_VOICE_SECONDS) {
      stopRec(true);
    }
  }, [recording, recSeconds, stopRec]);

  const play = async (msg: ChatMessage) => {
    if (playingId === msg.id) {
      await stopVoice().catch(() => {});
      setPlayingId(null);
      return;
    }
    const { url, headers } = friendsService.voiceSource(token, msg.id);
    setPlayingId(msg.id);
    try {
      await playVoice(url, headers, () => setPlayingId(null));
    } catch {
      setPlayingId(null);
      setNotice({ text: "This voice message can't play right now.", tone: 'info' });
    }
  };

  // ---- "Tell my grown-up" ----
  const report = (msg: ChatMessage) =>
    Alert.alert('Tell your grown-up about this message?', 'Your grown-up will get an email and can help. 💜', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, tell',
        onPress: async () => {
          try {
            await friendsService.report(token, msg.id);
            setMessages(current => current.map(m => (m.id === msg.id ? { ...m, reported: true } : m)));
            setNotice({ text: 'Thank you for telling! Your grown-up will see it. 💜', tone: 'info' });
          } catch (e) {
            setNotice({ text: e instanceof ApiError ? e.message : 'Something went wrong.', tone: 'info' });
          }
        },
      },
    ]);

  const leaveGroup = () => {
    if (chat.kind !== 'group') {
      return;
    }
    Alert.alert(`Leave ${chat.group.name}?`, 'Your school can invite you again.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await friendsService.leaveGroup(token, chat.group.id);
            setShowMembers(false);
            onLeftGroup();
          } catch (e) {
            setNotice({ text: e instanceof ApiError ? e.message : 'Something went wrong.', tone: 'info' });
          }
        },
      },
    ]);
  };

  const togglePanel = (next: Panel) => {
    setNotice(null);
    setPanel(current => (current === next ? null : next));
  };

  // ---- top bar: who this chat is with ----
  let right: React.ReactNode = null;
  if (chat.kind === 'friend') {
    right = <KidAvatar look={Look.safeHuman(chat.friend.id, chat.friend.look)} feeling={chat.friend.feeling} size={52} headOnly />;
  } else if (chat.kind === 'parent') {
    right = <AppText style={styles.topIcon}>👪</AppText>;
  } else {
    right = (
      <Pressable
        onPress={() => setShowMembers(true)}
        accessibilityRole="button"
        accessibilityLabel="Who is in this group"
        style={({ pressed }) => [styles.membersButton, pressed && styles.pressed]}>
        <AppText style={styles.topIcon}>👥</AppText>
      </Pressable>
    );
  }

  const both = allowed.freeText && allowed.voice;
  const phrases = phraseCategories.find(c => c.id === category)?.phrases ?? [];

  return (
    <View style={styles.screen}>
      <TopBar title={chat.title} onBack={onBack} right={right} />

      {/* ---- the messages ---- */}
      <ScrollView ref={scrollRef} style={styles.list} contentContainerStyle={styles.listContent}>
        {loaded && messages.length === 0 && !closed && (
          <View style={styles.empty}>
            <AppText style={styles.emptyIcon}>👋</AppText>
            <AppText style={styles.emptyText}>
              {chat.kind === 'parent' ? 'Say hi to your grown-up!' : 'Say hi! Tap 💬 Words to pick something to say.'}
            </AppText>
          </View>
        )}
        {messages.map(msg => {
          const mine = msg.from.type === 'kid' && msg.from.id === me.id;
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              mine={mine}
              sender={msg.from.type === 'kid' ? people.get(msg.from.id) : undefined}
              showName={!mine && (chat.kind === 'group' || msg.from.type !== 'kid')}
              playing={playingId === msg.id}
              onPlay={() => play(msg)}
              onReport={!mine && msg.from.type === 'kid' ? () => report(msg) : undefined}
            />
          );
        })}
      </ScrollView>

      {closed && (
        <View style={[styles.notice, styles.noticeInfo]}>
          <AppText style={styles.noticeText}>🔒 {closed}</AppText>
        </View>
      )}

      {notice && (
        <Pressable
          onPress={() => setNotice(null)}
          accessibilityRole="button"
          accessibilityLabel={`${notice.text} Tap to close.`}
          style={[styles.notice, notice.tone === 'stop' ? styles.noticeStop : styles.noticeInfo]}>
          <AppText style={styles.noticeText}>
            {notice.tone === 'stop' ? '🛑 ' : ''}
            {notice.text}
          </AppText>
          <AppText style={styles.noticeClose}>OK ✓</AppText>
        </Pressable>
      )}

      {/* ---- panels ---- */}
      {!closed && panel === 'phrases' && (
        <View style={styles.panel}>
          <View style={styles.categories}>
            {phraseCategories.map(c => (
              <Pressable
                key={c.id}
                onPress={() => setCategory(c.id)}
                accessibilityRole="tab"
                accessibilityLabel={c.name}
                accessibilityState={{ selected: c.id === category }}
                style={[styles.category, c.id === category && styles.categorySelected]}>
                <AppText style={[styles.categoryText, c.id === category && styles.categoryTextSelected]}>
                  {c.icon} {c.name}
                </AppText>
              </Pressable>
            ))}
          </View>
          <ScrollView style={styles.phraseScroll} contentContainerStyle={styles.phrases}>
            {phrases.map(p => (
              <Pressable
                key={p.id}
                onPress={() => !sending && sendPhrase(p.id)}
                accessibilityRole="button"
                accessibilityLabel={`Send: ${p.text}`}
                style={({ pressed }) => [styles.phrase, pressed && styles.pressed]}>
                <AppText style={styles.phraseText}>{p.text}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {!closed && panel === 'feelings' && (
        <View style={styles.panel}>
          <AppText style={styles.panelTitle}>Send a feeling</AppText>
          <ScrollView style={styles.phraseScroll} contentContainerStyle={styles.feelingGrid}>
            {feelings.map(f => (
              <FeelingButton key={f.id} emoji={f.emoji} name={f.name} onPress={() => !sending && sendFeeling(f.id)} />
            ))}
          </ScrollView>
        </View>
      )}

      {!closed && panel === 'voice' && (
        <View style={[styles.panel, styles.voicePanel]}>
          {recording ? (
            <>
              <AppText style={styles.recording} accessibilityLiveRegion="polite">
                🔴 Recording… {recSeconds} s
              </AppText>
              <View style={styles.row}>
                <KidButton label="✖ Cancel" variant="soft" onPress={() => stopRec(false)} style={styles.darkSoft} />
                <KidButton label="⏹️ Stop and send" onPress={() => stopRec(true)} />
              </View>
            </>
          ) : (
            <>
              <AppText style={styles.panelTitle}>Voice message</AppText>
              <KidButton label={sending ? 'Sending…' : '🎤 Start recording'} onPress={startRec} disabled={sending} />
              <AppText style={styles.panelHint}>Up to {MAX_VOICE_SECONDS} seconds.</AppText>
            </>
          )}
        </View>
      )}

      {/* ---- the toolbar ---- */}
      {!closed && (
        <View style={styles.toolbar}>
          <RoundToolButton small icon="💬" label="Words" active={panel === 'phrases'} onPress={() => togglePanel('phrases')} />
          <RoundToolButton small icon="💜" label="Feelings" active={panel === 'feelings'} onPress={() => togglePanel('feelings')} />
          {allowed.freeText && (
            <RoundToolButton
              small
              icon="⌨️"
              label="Type"
              onPress={() => {
                setPanel(null);
                setNotice(null);
                setTyping(true);
              }}
            />
          )}
          {allowed.voice && (
            <RoundToolButton small icon="🎤" label="Voice" active={panel === 'voice'} onPress={() => togglePanel('voice')} />
          )}
        </View>
      )}
      {!closed && !both && chat.kind !== 'parent' && (
        <AppText style={styles.offNote}>
          {!allowed.freeText && !allowed.voice
            ? 'Typing and voice messages are off. A grown-up can turn them on.'
            : !allowed.freeText
            ? 'Typing is off. A grown-up can turn it on.'
            : 'Voice messages are off. A grown-up can turn them on.'}
        </AppText>
      )}

      <TextEntryModal
        visible={typing}
        title="Type a message"
        placeholder="Write here"
        maxLength={200}
        doneLabel={sending ? 'Sending…' : 'Send'}
        busy={sending}
        onDone={sendText}
        onCancel={() => setTyping(false)}
      />

      {chat.kind === 'group' && (
        <Modal visible={showMembers} transparent animationType="fade" onRequestClose={() => setShowMembers(false)} statusBarTranslucent>
          <View style={styles.dimmer}>
            <View style={styles.card}>
              <AppText style={styles.cardTitle}>{chat.group.name}</AppText>
              <AppText style={styles.cardText}>🏫 Made by {chat.group.school}</AppText>
              <ScrollView contentContainerStyle={styles.memberGrid}>
                {members.map(m => (
                  <View key={m.id} style={styles.member}>
                    <KidAvatar look={Look.safeHuman(m.id, m.look)} feeling={m.feeling} size={60} headOnly />
                    <AppText style={styles.memberName} numberOfLines={2}>
                      {m.id === me.id ? `${m.username}\n(me)` : m.username}
                    </AppText>
                  </View>
                ))}
              </ScrollView>
              <KidButton label="Close" onPress={() => setShowMembers(false)} />
              <KidButton label="Leave this group" variant="soft" onPress={leaveGroup} style={styles.darkSoft} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

/** "2026-10-08T14:05:00Z" -> "14:05" (the phone's own time). */
function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ===========================================================================
// One message
// ===========================================================================

interface BubbleProps {
  msg: ChatMessage;
  mine: boolean;
  sender?: UserJson;
  showName: boolean;
  playing: boolean;
  onPlay: () => void;
  onReport?: () => void;
}

function MessageBubble({ msg, mine, sender, showName, playing, onPlay, onReport }: BubbleProps) {
  const isTeacher = msg.from.type === 'school';
  const isParent = msg.from.type === 'parent';

  // ---- what is inside the bubble ----
  let body: React.ReactNode;
  let label: string;
  switch (msg.kind) {
    case 'phrase':
      label = phraseText(msg.phraseId ?? '');
      body = <AppText style={[styles.bubbleText, mine && styles.mineText]}>{label}</AppText>;
      break;
    case 'feeling': {
      const f = getFeeling(msg.feelingId ?? '');
      label = f ? `I feel ${f.name.toLowerCase()}` : 'A feeling';
      body = (
        <View style={styles.feelingCard}>
          <AppText style={styles.feelingEmoji}>{f?.emoji ?? '💜'}</AppText>
          <AppText style={[styles.bubbleText, mine && styles.mineText, styles.bold]}>{label}</AppText>
        </View>
      );
      break;
    }
    case 'voice':
      label = `Voice message, ${msg.seconds ?? 0} seconds`;
      body = (
        <Pressable
          onPress={onPlay}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Stop the voice message' : `Play the voice message, ${msg.seconds ?? 0} seconds`}
          style={({ pressed }) => [styles.voice, mine && styles.voiceMine, pressed && styles.pressed]}>
          <AppText style={styles.voiceIcon}>{playing ? '⏹️' : '▶️'}</AppText>
          <AppText style={[styles.bubbleText, mine && styles.mineText]}>
            Voice · {msg.seconds ?? 0} s
          </AppText>
        </Pressable>
      );
      break;
    case 'hidden':
      label = msg.hiddenKind === 'voice' ? 'A voice message (turned off)' : 'A typed message (turned off)';
      body = (
        <AppText style={[styles.bubbleText, styles.hiddenText]}>
          🔒 {msg.hiddenKind === 'voice' ? 'A voice message.' : 'A typed message.'} Your grown-up turned these off.
        </AppText>
      );
      break;
    case 'text':
    default:
      label = msg.text ?? '';
      body = <AppText style={[styles.bubbleText, mine && styles.mineText]}>{label}</AppText>;
  }

  // ---- who sent it ----
  let face: React.ReactNode = null;
  if (!mine) {
    if (msg.from.type === 'kid' && sender) {
      face = <KidAvatar look={Look.safeHuman(sender.id, sender.look)} feeling={sender.feeling} size={44} headOnly />;
    } else {
      face = (
        <View style={styles.iconFace}>
          <AppText style={styles.iconFaceText}>{isParent ? '👪' : isTeacher ? '🏫' : '🙂'}</AppText>
        </View>
      );
    }
  }

  return (
    <View
      style={[styles.messageRow, mine ? styles.rowMine : styles.rowOther]}
      accessible
      accessibilityLabel={`${mine ? 'Me' : msg.from.name}: ${label}`}>
      {face}
      <View style={[styles.bubbleColumn, mine && styles.columnMine]}>
        {showName && <AppText style={styles.senderName}>{msg.from.name}</AppText>}
        <View
          style={[
            styles.bubble,
            mine ? styles.bubbleMine : styles.bubbleOther,
            isTeacher && styles.bubbleTeacher,
            msg.kind === 'hidden' && styles.bubbleHidden,
          ]}>
          {body}
        </View>
        <View style={[styles.meta, mine && styles.metaMine]}>
          <AppText style={styles.time}>{timeOf(msg.createdAt)}</AppText>
          {onReport &&
            (msg.reported ? (
              <AppText style={styles.reported}>✓ Grown-up told</AppText>
            ) : (
              <Pressable
                onPress={onReport}
                accessibilityRole="button"
                accessibilityLabel="Tell my grown-up about this message"
                hitSlop={10}
                style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}>
                <AppText style={styles.reportText}>🚩 Tell my grown-up</AppText>
              </Pressable>
            ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topIcon: {
    fontSize: 34,
    lineHeight: 44,
  },
  membersButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purpleBright,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 56,
    lineHeight: 70,
  },
  emptyText: {
    color: colors.textSoft,
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubbleColumn: {
    maxWidth: '78%',
    alignItems: 'flex-start',
  },
  columnMine: {
    alignItems: 'flex-end',
  },
  senderName: {
    color: colors.textSoft,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.4,
    marginLeft: spacing.xs,
  },
  bubble: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: {
    backgroundColor: colors.purpleBright,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 6,
  },
  bubbleTeacher: {
    borderWidth: 3,
    borderColor: '#FACC15',
  },
  bubbleHidden: {
    backgroundColor: '#E5E7EB',
  },
  bubbleText: {
    color: colors.textDark,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.4,
  },
  mineText: {
    color: colors.textLight,
  },
  hiddenText: {
    color: '#374151',
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  feelingCard: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  feelingEmoji: {
    fontSize: 48,
    lineHeight: 60,
  },
  voice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingRight: spacing.sm,
  },
  voiceMine: {},
  voiceIcon: {
    fontSize: 28,
    lineHeight: 36,
  },
  iconFace: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.spacePanel,
    borderWidth: 2,
    borderColor: colors.purpleGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFaceText: {
    fontSize: 24,
    lineHeight: 30,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
    marginLeft: spacing.xs,
  },
  metaMine: {
    marginRight: spacing.xs,
  },
  time: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  reportButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.textSoft,
  },
  reportText: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  reported: {
    color: '#86EFAC',
    fontSize: 13,
    lineHeight: 18,
  },
  notice: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 2,
  },
  noticeStop: {
    backgroundColor: '#FEF3C7',
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  noticeInfo: {
    backgroundColor: colors.card,
  },
  noticeText: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.4,
  },
  noticeClose: {
    color: colors.leafNext,
    fontFamily: fonts.bold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'right',
  },
  panel: {
    backgroundColor: colors.spacePanel,
    borderTopWidth: 3,
    borderColor: colors.purpleGlow,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  panelTitle: {
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  panelHint: {
    color: colors.textSoft,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'center',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  category: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: colors.purpleGlow,
  },
  categorySelected: {
    backgroundColor: colors.card,
    borderColor: colors.textLight,
  },
  categoryText: {
    color: colors.textSoft,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  categoryTextSelected: {
    color: colors.textDark,
  },
  phraseScroll: {
    maxHeight: 230,
    flexGrow: 0,
  },
  phrases: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  phrase: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
    justifyContent: 'center',
  },
  phraseText: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
  },
  feelingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  voicePanel: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  recording: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.space,
  },
  offNote: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  darkSoft: {
    backgroundColor: colors.leafNext,
  },
  dimmer: {
    flex: 1,
    backgroundColor: 'rgba(10, 4, 30, 0.75)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: colors.purpleGlow,
    padding: spacing.md,
    gap: spacing.sm,
    maxHeight: '90%',
  },
  cardTitle: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
    textAlign: 'center',
  },
  cardText: {
    color: colors.textDark,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'center',
  },
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  member: {
    width: 90,
    alignItems: 'center',
  },
  memberName: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 88,
    textAlign: 'center',
  },
});
