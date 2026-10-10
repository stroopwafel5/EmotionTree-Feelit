/**
 * RoomScene.tsx
 * --------------------------------------------------------------------------
 * The child's own room on the space station (like a Club Penguin igloo):
 * a round window with stars and a planet, a floor, the child's avatar with
 * a name tag, the space buddy next to them, and a thought bubble showing
 * how the child feels right now.
 *
 * Tapping the bubble opens the feeling picker (onFeelingPress).
 * Nothing moves or flashes - calm on purpose.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import type { User } from '../../models/User';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme/theme';
import AppText from '../AppText';
import BuddyAvatar from './BuddyAvatar';
import KidAvatar from './KidAvatar';

interface RoomSceneProps {
  user: User;
  /** Called when the child taps the feeling bubble. */
  onFeelingPress?: () => void;
  /** Height of the avatar (the room grows with it). */
  avatarSize?: number;
}

export default function RoomScene({ user, onFeelingPress, avatarSize = 190 }: RoomSceneProps) {
  const feeling = user.getFeeling();
  return (
    <View style={styles.room}>
      {/* Background: wall, window and floor */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 360 300" preserveAspectRatio="none">
          <Rect x={0} y={0} width={360} height={300} fill="#2D1466" />
          <Rect x={0} y={0} width={360} height={14} fill="#3B1C7F" />
          {/* round window */}
          <Circle cx={292} cy={78} r={46} fill="#5B21B6" />
          <Circle cx={292} cy={78} r={38} fill="#0B0618" />
          <Circle cx={278} cy={66} r={2} fill="#FFFFFF" />
          <Circle cx={304} cy={92} r={1.6} fill="#FFFFFF" />
          <Circle cx={312} cy={62} r={1.4} fill="#FFFFFF" />
          <Circle cx={284} cy={98} r={10} fill="#F59E0B" />
          <Ellipse cx={284} cy={98} rx={17} ry={4} fill="none" stroke="#FCD34D" strokeWidth={2} />
          {/* floor */}
          <Path d="M0 214 L360 214 L360 300 L0 300 Z" fill="#4C1D95" />
          <Ellipse cx={170} cy={262} rx={140} ry={28} fill="#5B21B6" />
        </Svg>
      </View>

      {/* Thought bubble with the feeling */}
      <Pressable
        onPress={onFeelingPress}
        disabled={!onFeelingPress}
        accessibilityRole="button"
        accessibilityLabel={feeling ? `I feel ${feeling.name}. Tap to change.` : 'How do you feel? Tap to choose.'}
        style={styles.bubbleWrap}>
        <View style={styles.bubble}>
          <AppText style={styles.bubbleEmoji}>{feeling ? feeling.emoji : '💭'}</AppText>
          <AppText style={styles.bubbleText}>
            {feeling ? `I feel ${feeling.name.toLowerCase()}` : 'How do I feel?'}
          </AppText>
        </View>
        <View style={[styles.dot, styles.dotBig]} />
        <View style={[styles.dot, styles.dotSmall]} />
      </Pressable>

      {/* The child and the buddy, standing on the floor */}
      <View style={styles.floorRow}>
        <View style={styles.kid}>
          <KidAvatar look={user.look} feeling={user.feeling} size={avatarSize} />
          <View style={styles.nameTag}>
            <AppText style={styles.nameText} numberOfLines={1}>
              {user.username}
            </AppText>
          </View>
        </View>
        <View style={styles.buddy}>
          <BuddyAvatar pet={user.pet} size={avatarSize * 0.55} ownerFeeling={user.feeling} />
          <AppText style={styles.buddyName} numberOfLines={1}>
            {user.pet.name}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  room: {
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: colors.purpleGlow,
    overflow: 'hidden',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    alignSelf: 'stretch',
  },
  bubbleWrap: {
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
    marginBottom: -spacing.sm,
    zIndex: 2,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
  },
  bubbleEmoji: {
    fontSize: 26,
    lineHeight: 34,
  },
  bubbleText: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  dot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.purpleGlow,
  },
  dotBig: {
    width: 14,
    height: 14,
    marginLeft: 60,
    marginTop: 4,
  },
  dotSmall: {
    width: 8,
    height: 8,
    marginLeft: 70,
    marginTop: 2,
  },
  floorRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  kid: {
    alignItems: 'center',
  },
  buddy: {
    alignItems: 'center',
    marginBottom: 34,
  },
  nameTag: {
    marginTop: -6,
    backgroundColor: colors.card,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    maxWidth: 160,
  },
  nameText: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  buddyName: {
    color: colors.textSoft,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.4,
    maxWidth: 110,
  },
});
