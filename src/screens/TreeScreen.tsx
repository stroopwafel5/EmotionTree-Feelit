/**
 * TreeScreen.tsx
 * --------------------------------------------------------------------------
 * Shows the child's rainbow tree: the Duolingo-style path of leaves.
 *
 * The path itself is drawn by MyTree.draw() (see models/MyTree.tsx), exactly
 * as the brief asks. This screen only adds what is around it:
 *   - a "Home" button and a title at the top
 *   - one short hint telling the child what to do
 *   - a scroll view, so the path fits on small phones
 *   - it scrolls by itself to the glowing (next) leaf, so the child never
 *     has to search for it on a long path
 *
 * MainScreen draws this screen again every time the tree changes, so a
 * finished leaf turns light purple straight away.
 */
import React, { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../components/AppText';
import KidButton from '../components/KidButton';
import type { MyTree } from '../models/MyTree';
import { colors, fontSizes, fonts, spacing } from '../theme/theme';

interface TreeScreenProps {
  /** The child's tree. */
  tree: MyTree;
  /** Called with the level id when a clickable leaf is tapped. */
  onLeafPress: (levelId: number) => void;
  /** Called when the child taps "Home". */
  onHome: () => void;
}

export default function TreeScreen({
  tree,
  onLeafPress,
  onHome,
}: TreeScreenProps) {
  const scrollRef = useRef<ScrollView>(null);
  // Scroll to the next leaf only once, when the screen opens.
  const scrolledRef = useRef(false);

  /** Called by MyTree.draw() with the next leaf's position. */
  const scrollToNextLeaf = (y: number) => {
    if (scrolledRef.current) {
      return;
    }
    scrolledRef.current = true;
    // Wait one frame, so the scroll view is ready and has measured the path.
    requestAnimationFrame(() => {
      // Leave some space above the leaf, so the path above it shows too.
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 160), animated: false });
    });
  };

  // One clear instruction at a time.
  const next = tree.getNextLeaf();
  const hint = next
    ? `Tap the glowing leaf: ${next.name}!`
    : 'Tap any leaf to play it again!';

  return (
    <View style={styles.screen}>
      {/* Top bar: same place on every screen. */}
      <View style={styles.topBar}>
        <KidButton
          label="🏠 Home"
          variant="soft"
          onPress={onHome}
          accessibilityLabel="Go back to the start screen"
        />
        <AppText style={styles.title} numberOfLines={1}>
          My Rainbow Tree
        </AppText>
      </View>

      <AppText style={styles.hint}>{hint}</AppText>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.pathArea}
        showsVerticalScrollIndicator={false}>
        {/* The brief's draw(): all leaves, coloured by their status. */}
        {tree.draw(onLeafPress, scrollToNextLeaf)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  title: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
  },
  hint: {
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    color: colors.textSoft,
    paddingHorizontal: spacing.md,
  },
  pathArea: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
});
