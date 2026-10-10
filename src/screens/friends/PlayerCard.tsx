/**
 * PlayerCard.tsx
 * --------------------------------------------------------------------------
 * A friend's "player card" (like in Club Penguin): opens when the child taps
 * a friend. Shows the friend's avatar, space buddy and how they feel, with
 * a big "Chat" button.
 *
 * "Stop being friends" asks first. (Parents can also remove a friend from
 * the parent page.)
 */
import React, { useMemo } from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';

import AppText from '../../components/AppText';
import BuddyAvatar from '../../components/avatar/BuddyAvatar';
import KidAvatar from '../../components/avatar/KidAvatar';
import KidButton from '../../components/KidButton';
import { User, type UserJson } from '../../models/User';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';

interface PlayerCardProps {
  /** The friend to show (null = closed). */
  friend: UserJson | null;
  onChat: (friend: UserJson) => void;
  onRemove: (friend: UserJson) => void;
  onClose: () => void;
}

export default function PlayerCard({ friend, onChat, onRemove, onClose }: PlayerCardProps) {
  const user = useMemo(() => (friend ? User.fromJson(friend) : null), [friend]);
  if (!friend || !user) {
    return null;
  }
  const feeling = user.getFeeling();

  const confirmRemove = () =>
    Alert.alert(`Stop being friends with ${user.username}?`, 'You will not be able to chat any more.', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, stop', style: 'destructive', onPress: () => onRemove(friend) },
    ]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.dimmer}>
        <View style={styles.card}>
          <AppText style={styles.name}>{user.username}</AppText>
          <View style={styles.scene}>
            <KidAvatar look={user.look} feeling={user.feeling} size={200} />
            <View style={styles.buddy}>
              <BuddyAvatar pet={user.pet} size={100} ownerFeeling={user.feeling} />
              <AppText style={styles.buddyName} numberOfLines={1}>
                {user.pet.name}
              </AppText>
            </View>
          </View>
          <View style={styles.feeling}>
            <AppText style={styles.feelingText}>
              {feeling
                ? `${feeling.emoji} ${user.username} feels ${feeling.name.toLowerCase()}`
                : `${user.username} didn't share a feeling right now.`}
            </AppText>
          </View>
          <KidButton label={`💬 Chat with ${user.username}`} onPress={() => onChat(friend)} />
          <View style={styles.row}>
            <KidButton label="Close" variant="soft" onPress={onClose} style={styles.soft} />
            <KidButton label="Stop being friends" variant="soft" onPress={confirmRemove} style={styles.soft} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  },
  name: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * 1.25,
    textAlign: 'center',
  },
  scene: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: colors.spacePanel,
    borderRadius: radius.md,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  buddy: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buddyName: {
    color: colors.textSoft,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.4,
    maxWidth: 110,
  },
  feeling: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'center',
  },
  feelingText: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.4,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  soft: {
    backgroundColor: colors.leafNext,
  },
});
