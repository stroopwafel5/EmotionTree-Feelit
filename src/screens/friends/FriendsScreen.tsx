/**
 * FriendsScreen.tsx
 * --------------------------------------------------------------------------
 * The Friends page. From top to bottom:
 *
 *   👪 My grown-up         - always here: chat with your own parent
 *   🤝 New friend requests  - only after BOTH parents said yes
 *   My friends             - tap a friend to open their player card
 *   ➕ Add a friend         - with the friend's code
 *   ⏳ Waiting              - requests you sent
 *   🏫 Class groups         - made by your school or kindergarten
 *   My friend code         - tell it to a friend in real life
 *   For grown-ups          - the 👪 Grown-up corner (PIN: approve friends and
 *                            groups, typing/voice on or off, parent page),
 *                            turn off Friends
 *
 * While Friends is not on yet (older accounts waiting for an email), a
 * "waiting" card is shown, where a grown-up can also turn it on right away
 * with the password + a grown-up PIN.
 *
 * MainScreen gives this screen the latest "overview" from the server
 * (it refreshes every few seconds - see useFriendsOverview).
 */
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../../components/AppText';
import KidAvatar from '../../components/avatar/KidAvatar';
import KidButton from '../../components/KidButton';
import TopBar from '../../components/TopBar';
import { Look } from '../../models/Look';
import type { UserJson } from '../../models/User';
import { ApiError } from '../../services/api';
import type { Account } from '../../services/authService';
import { getFeeling } from '../../services/feelings';
import { prettyCode } from '../../services/friendCode';
import {
  friendsService,
  type FriendJson,
  type FriendsOverview,
  type GroupJson,
  type OpenChat,
} from '../../services/friendsService';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';
import AddFriendModal from './AddFriendModal';
import GrownUpForm from './GrownUpForm';
import PlayerCard from './PlayerCard';

interface FriendsScreenProps {
  token: string;
  overview: FriendsOverview | null;
  error: ApiError | null;
  refresh: () => Promise<void>;
  onOpenChat: (chat: OpenChat) => void;
  onHome: () => void;
  /** Forget Friends on this phone. */
  onTurnOff: () => void;
  account: Account;
  /** Open the Grown-up corner (PIN). */
  onOpenGrownUp: () => void;
  /** A grown-up turned Friends on here (a new login was saved). */
  onReconnected: () => void;
}

export default function FriendsScreen({
  token,
  overview,
  error,
  refresh,
  onOpenChat,
  onHome,
  onTurnOff,
  account,
  onOpenGrownUp,
  onReconnected,
}: FriendsScreenProps) {
  const [adding, setAdding] = useState(false);
  const [card, setCard] = useState<UserJson | null>(null);
  const [note, setNote] = useState<string | null>(null);

  /** Runs a server action, shows its problem (if any) and refreshes. */
  const act = async (action: () => Promise<unknown>, done?: string) => {
    setNote(null);
    try {
      await action();
      if (done) {
        setNote(done);
      }
    } catch (e) {
      setNote(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    }
    await refresh();
  };

  const turnOff = () =>
    Alert.alert('Turn off Friends on this phone?', 'Friends and chats stay safe on the server. A grown-up can turn it on again.', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, turn off', style: 'destructive', onPress: onTurnOff },
    ]);

  const top = <TopBar title="My Friends" onBack={onHome} backLabel="🏠 Home" backHint="Go back home" />;

  // ---- Still loading, or the server can't be reached ----
  if (!overview) {
    return (
      <View style={styles.screen}>
        {top}
        <View style={styles.center}>
          {error ? (
            <>
              <AppText style={styles.bigIcon}>📡</AppText>
              <AppText style={styles.centerText}>{error.message}</AppText>
              <KidButton label="Try again" onPress={refresh} />
            </>
          ) : (
            <AppText style={styles.centerText}>Loading your friends… 🚀</AppText>
          )}
        </View>
      </View>
    );
  }

  const { me } = overview;

  // ---- The parent has not said yes yet ----
  if (!me.verified) {
    return (
      <View style={styles.screen}>
        {top}
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.panel}>
            <AppText style={styles.bigIcon}>📧</AppText>
            <AppText style={styles.panelTitle}>Waiting for your grown-up</AppText>
            <AppText style={styles.panelText}>
              We sent an email to {me.parentEmailHint}. Your grown-up must tap "Yes" in the email. Then Friends is ready!
            </AppText>
            <KidButton label="Check again" onPress={() => act(refresh)} />
            <KidButton
              label="Send the email again"
              variant="soft"
              onPress={() => act(() => friendsService.resendVerification(token), 'We sent the email again. 📧')}
            />
            {note ? <AppText style={styles.note}>{note}</AppText> : null}
          </View>
          <View style={styles.grownUps}>
            <AppText style={styles.grownUpsTitle}>Grown-up here? No need to wait for the email.</AppText>
            <AppText style={styles.grownUpsText}>Type the account password and make a grown-up PIN:</AppText>
            <GrownUpForm account={account} label="Turn on Friends now" onDone={onReconnected} />
          </View>
          <KidButton label="Turn off Friends on this phone" variant="soft" onPress={turnOff} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {top}
      <ScrollView contentContainerStyle={styles.content}>
        {/* ---- My grown-up (always there) ---- */}
        <ChatRow
          icon="👪"
          title="My grown-up"
          subtitle="Talk to your grown-up"
          badge={overview.parent.unread}
          onPress={() => onOpenChat({ kind: 'parent', ref: 'parent', title: 'My grown-up' })}
        />

        {note ? (
          <View style={styles.noteBox}>
            <AppText style={styles.noteText}>{note}</AppText>
          </View>
        ) : null}

        {/* ---- Something is waiting for the grown-up ---- */}
        {(overview.grownUpWaiting ?? 0) > 0 && (
          <View style={styles.waitingGrownUp}>
            <AppText style={styles.waitingGrownUpText}>
              👪 Your grown-up has {overview.grownUpWaiting} thing{overview.grownUpWaiting === 1 ? '' : 's'} to say yes
              or no to. Ask them to open the Grown-up corner (at the bottom).
            </AppText>
          </View>
        )}

        {/* ---- New friend requests (both parents already said yes) ---- */}
        {overview.incoming.map(request => (
          <View key={request.id} style={styles.request}>
            <KidAvatar look={Look.safeHuman(request.from.id, request.from.look)} feeling={request.from.feeling} size={64} headOnly />
            <View style={styles.requestBody}>
              <AppText style={styles.requestText}>
                <AppText style={styles.requestName}>{request.from.username}</AppText> wants to be your friend! Your grown-ups said
                yes.
              </AppText>
              <View style={styles.requestButtons}>
                <KidButton
                  label="Yes! 🤝"
                  onPress={() =>
                    act(
                      () => friendsService.answerRequest(token, request.id, 'accept'),
                      `You and ${request.from.username} are friends now! 🎉`,
                    )
                  }
                />
                <KidButton
                  label="No, thanks"
                  variant="soft"
                  onPress={() => act(() => friendsService.answerRequest(token, request.id, 'decline'))}
                  style={styles.darkSoft}
                />
              </View>
            </View>
          </View>
        ))}

        {/* ---- My friends ---- */}
        <AppText style={styles.section}>My friends</AppText>
        {overview.friends.length === 0 ? (
          <AppText style={styles.empty}>No friends yet. Tap "Add a friend" and use your friend's code.</AppText>
        ) : (
          <View style={styles.friendGrid}>
            {overview.friends.map(friend => (
              <FriendTile key={friend.id} friend={friend} onPress={() => setCard(friend)} />
            ))}
          </View>
        )}
        <KidButton label="➕ Add a friend" onPress={() => setAdding(true)} />

        {/* ---- Requests I sent ---- */}
        {overview.outgoing.map(request => (
          <View key={request.id} style={styles.waiting}>
            <AppText style={styles.waitingText}>
              ⏳ {request.to.username}:{' '}
              {request.stage === 'parents' ? 'waiting for the grown-ups to say yes' : `waiting for ${request.to.username} to say yes`}
            </AppText>
            <KidButton
              label="Cancel"
              variant="soft"
              onPress={() => act(() => friendsService.answerRequest(token, request.id, 'cancel'))}
            />
          </View>
        ))}

        {/* ---- Groups (made by schools and kindergartens only) ---- */}
        {overview.groups.length > 0 && (
          <>
            <AppText style={styles.section}>🏫 Class groups</AppText>
            {overview.groups.map(group => (
              <ChatRow
                key={group.id}
                icon="🏫"
                title={group.name}
                subtitle={`${group.school} · ${group.members.length} kids`}
                badge={group.unread}
                onPress={() => onOpenChat(groupChat(group))}
              />
            ))}
          </>
        )}

        {/* ---- My friend code ---- */}
        <View style={styles.codeCard}>
          <AppText style={styles.codeLabel}>My friend code</AppText>
          <AppText style={styles.code} accessibilityLabel={`My friend code: ${me.friendCode}`}>
            {prettyCode(me.friendCode)}
          </AppText>
          <AppText style={styles.codeHint}>Tell this code to a friend you know in real life.</AppText>
        </View>

        {/* ---- For grown-ups ---- */}
        <View style={styles.grownUps}>
          <AppText style={styles.grownUpsTitle}>For grown-ups</AppText>
          <AppText style={styles.grownUpsText}>
            Typing: {me.settings.freeText ? 'on' : 'off'} · Voice: {me.settings.voice ? 'on' : 'off'}. Approve friends and
            groups, change these and open the parent page in the Grown-up corner (with your grown-up PIN).
          </AppText>
          <KidButton
            label={
              (overview.grownUpWaiting ?? 0) > 0
                ? `👪 Grown-up corner (${overview.grownUpWaiting} waiting)`
                : '👪 Grown-up corner'
            }
            onPress={onOpenGrownUp}
          />
          <KidButton label="Turn off Friends on this phone" variant="soft" onPress={turnOff} />
        </View>
      </ScrollView>

      <AddFriendModal visible={adding} token={token} onClose={() => setAdding(false)} onSent={refresh} />
      <PlayerCard
        friend={card}
        onClose={() => setCard(null)}
        onChat={friend => {
          setCard(null);
          onOpenChat({ kind: 'friend', ref: `friend-${friend.id}`, title: friend.username, friend });
        }}
        onRemove={friend => {
          setCard(null);
          act(() => friendsService.removeFriend(token, friend.id), `You and ${friend.username} are not friends any more.`);
        }}
      />
    </View>
  );
}

export function groupChat(group: GroupJson): OpenChat {
  return { kind: 'group', ref: `group-${group.id}`, title: group.name, group };
}

/** A big row button: grown-up chat or a class group. */
function ChatRow({
  icon,
  title,
  subtitle,
  badge,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  badge: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge > 0 ? `${title}, ${badge} new` : title}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <AppText style={styles.rowIcon}>{icon}</AppText>
      <View style={styles.rowBody}>
        <AppText style={styles.rowTitle} numberOfLines={1}>
          {title}
        </AppText>
        <AppText style={styles.rowSubtitle} numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      {badge > 0 && <Badge count={badge} />}
    </Pressable>
  );
}

/** One friend: head with the feeling, name and new-message number. */
function FriendTile({ friend, onPress }: { friend: FriendJson; onPress: () => void }) {
  const feeling = friend.feeling ? getFeeling(friend.feeling) : undefined;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${friend.username}${feeling ? `, feels ${feeling.name}` : ''}${
        friend.unread > 0 ? `, ${friend.unread} new` : ''
      }`}
      style={({ pressed }) => [styles.friend, pressed && styles.pressed]}>
      <KidAvatar look={Look.safeHuman(friend.id, friend.look)} feeling={friend.feeling} size={80} headOnly />
      <AppText style={styles.friendName} numberOfLines={1}>
        {friend.username}
      </AppText>
      {feeling && (
        <View style={styles.friendFeeling}>
          <AppText style={styles.friendFeelingText}>{feeling.emoji}</AppText>
        </View>
      )}
      {friend.unread > 0 && (
        <View style={styles.friendBadge}>
          <Badge count={friend.unread} />
        </View>
      )}
    </Pressable>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <View style={styles.badge}>
      <AppText style={styles.badgeText}>{count > 9 ? '9+' : count}</AppText>
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
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  centerText: {
    textAlign: 'center',
  },
  bigIcon: {
    fontSize: 56,
    lineHeight: 70,
    textAlign: 'center',
  },
  panel: {
    backgroundColor: colors.spacePanel,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    padding: spacing.md,
    gap: spacing.md,
  },
  panelTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
    textAlign: 'center',
  },
  panelText: {
    color: colors.textSoft,
    textAlign: 'center',
  },
  note: {
    color: colors.textSoft,
    textAlign: 'center',
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
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
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.purpleBright,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 72,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  rowIcon: {
    fontSize: 36,
    lineHeight: 46,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.3,
  },
  rowSubtitle: {
    color: colors.textSoft,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.4,
  },
  request: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: '#FACC15',
    padding: spacing.sm,
  },
  requestBody: {
    flex: 1,
    gap: spacing.sm,
  },
  requestText: {
    color: colors.textDark,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.4,
  },
  requestButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  requestName: {
    // (a nested AppText starts white again, so the colour is set here too)
    color: colors.textDark,
    fontFamily: fonts.bold,
  },
  darkSoft: {
    // white text needs a dark fill on a light card
    backgroundColor: colors.leafNext,
  },
  section: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
    marginTop: spacing.sm,
  },
  empty: {
    color: colors.textSoft,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.4,
  },
  friendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  friend: {
    width: 108,
    alignItems: 'center',
    backgroundColor: colors.spacePanel,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.purpleGlow,
    paddingVertical: spacing.sm,
  },
  friendName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    maxWidth: 100,
  },
  friendFeeling: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendFeelingText: {
    fontSize: 20,
    lineHeight: 26,
  },
  friendBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 4,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: colors.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.textLight,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
  },
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.spacePanel,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  waitingText: {
    flex: 1,
    color: colors.textSoft,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  codeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  codeLabel: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  code: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * 1.3,
  },
  codeHint: {
    color: colors.textDark,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'center',
  },
  waitingGrownUp: {
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: '#F59E0B',
    padding: spacing.sm,
  },
  waitingGrownUpText: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.4,
  },
  grownUps: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.textSoft,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  grownUpsTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.3,
  },
  grownUpsText: {
    color: colors.textSoft,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.45,
  },
});
