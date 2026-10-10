/**
 * ShopScreen.tsx
 * --------------------------------------------------------------------------
 * The Space Shop: the child spends space candies 🍬 on special things for
 * themselves (guitar, cool shades, pumpkin costume, fire powers...) or for
 * their space buddy.
 *
 *  - Every item is shown ON the child's own avatar (or buddy), so they see
 *    exactly how it will look.
 *  - Tap an item: buy it (if there are enough candies), then it is worn
 *    straight away. Bought items can be put on and taken off any time
 *    (here, or in My look / My buddy → Extras).
 *  - Not enough candies? It says how many more are needed, kindly.
 *
 * The items and prices come from looks.json ("price").
 */
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../components/AppText';
import BuddyAvatar from '../components/avatar/BuddyAvatar';
import KidAvatar from '../components/avatar/KidAvatar';
import KidButton from '../components/KidButton';
import CandyCounter from '../components/rewards/CandyCounter';
import StudioTabs, { type StudioTab } from '../components/StudioTabs';
import TopBar from '../components/TopBar';
import type { Dec } from '../models/Dec';
import { Look, type HumanChoices } from '../models/Look';
import { Pet, type PetJson } from '../models/Pet';
import { itemKey } from '../models/Rewards';
import type { User } from '../models/User';
import { catalog } from '../services/looksCatalog';
import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';

type Tab = 'me' | 'buddy';
const TABS: StudioTab<Tab>[] = [
  { id: 'me', icon: '🧑‍🚀', label: 'For me' },
  { id: 'buddy', icon: '🐾', label: 'For my buddy' },
];

/** The shop items (things with a price in looks.json). */
export const shopItems = {
  me: catalog.human.accessories.filter(d => d.isShopItem()),
  buddy: catalog.pet.accessories.filter(d => d.isShopItem()),
};

interface ShopScreenProps {
  user: User;
  look: HumanChoices;
  pet: PetJson;
  candies: number;
  owned: string[];
  /** Buy an item. Returns null when bought, or how many more candies are needed. */
  onBuy: (key: string, price: number) => number | null;
  /** Put an item on (true) or take it off (false). */
  onWear: (forPet: boolean, id: string, wear: boolean) => void;
  onBack: () => void;
  /** Which tab to open first. */
  startTab?: Tab;
}

export default function ShopScreen({
  user,
  look,
  pet,
  candies,
  owned,
  onBuy,
  onWear,
  onBack,
  startTab = 'me',
}: ShopScreenProps) {
  const [tab, setTab] = useState<Tab>(startTab);
  const [chosen, setChosen] = useState<Dec | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const forPet = tab === 'buddy';
  const isOwned = (d: Dec) => owned.includes(itemKey(forPet, d.id));
  const isWorn = (d: Dec) => (forPet ? pet.accessories : look.accessories).includes(d.id);

  /** The child's avatar / buddy wearing one more thing. */
  const preview = (d: Dec, size: number) =>
    forPet ? (
      <BuddyAvatar
        pet={Pet.fromJson(user.id, { ...pet, accessories: [...pet.accessories.filter(a => a !== d.id), d.id] })}
        ownerFeeling={user.feeling}
        size={size}
      />
    ) : (
      <KidAvatar
        look={Look.safeHuman(user.id, { ...look, accessories: [...look.accessories.filter(a => a !== d.id), d.id] })}
        feeling={user.feeling}
        size={size}
      />
    );

  const open = (d: Dec) => {
    setMessage(null);
    setChosen(d);
  };

  const buyChosen = () => {
    if (!chosen) {
      return;
    }
    const need = onBuy(itemKey(forPet, chosen.id), chosen.price);
    if (need === null) {
      onWear(forPet, chosen.id, true);
      setMessage(`It's yours! 🎉 You're wearing your ${chosen.name.toLowerCase()} now.`);
    } else {
      setMessage(`You need ${need} more 🍬. Answer questions in leaves and tests to get more!`);
    }
  };

  return (
    <View style={styles.screen}>
      <TopBar title="🛍️ Shop" onBack={onBack} right={<CandyCounter candies={candies} />} />
      <AppText style={styles.intro}>Get 🍬 space candies by answering questions right. Spend them here!</AppText>
      <StudioTabs tabs={TABS} current={tab} onChange={setTab} />

      <ScrollView contentContainerStyle={styles.grid}>
        {shopItems[tab].map(d => {
          const mine = isOwned(d);
          return (
            <Pressable
              key={d.id}
              onPress={() => open(d)}
              accessibilityRole="button"
              accessibilityLabel={`${d.name}, ${mine ? (isWorn(d) ? 'yours, wearing' : 'yours') : `${d.price} candies`}`}
              style={({ pressed }) => [styles.tile, mine && styles.tileOwned, pressed && styles.pressed]}>
              <View style={styles.tilePreview}>{preview(d, forPet ? 110 : 130)}</View>
              <AppText style={styles.tileName} numberOfLines={1}>
                {d.icon} {d.name}
              </AppText>
              <View style={[styles.price, mine && styles.priceOwned, !mine && candies < d.price && styles.priceTooMuch]}>
                <AppText style={[styles.priceText, mine && styles.priceTextOwned]}>
                  {mine ? (isWorn(d) ? '✓ Wearing' : '✓ Yours') : `🍬 ${d.price}`}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ---- one item, big ---- */}
      <Modal visible={!!chosen} transparent animationType="fade" onRequestClose={() => setChosen(null)} statusBarTranslucent>
        <View style={styles.dimmer}>
          {chosen && (
            <View style={styles.card}>
              <AppText style={styles.cardTitle}>
                {chosen.icon} {chosen.name}
              </AppText>
              <View style={styles.bigPreview}>{preview(chosen, forPet ? 170 : 220)}</View>
              {message ? <AppText style={styles.message}>{message}</AppText> : null}
              {isOwned(chosen) ? (
                isWorn(chosen) ? (
                  <KidButton label="Take it off" onPress={() => onWear(forPet, chosen.id, false)} />
                ) : (
                  <KidButton label="Wear it ✨" onPress={() => onWear(forPet, chosen.id, true)} />
                )
              ) : (
                <KidButton
                  label={`Buy for ${chosen.price} 🍬`}
                  onPress={buyChosen}
                  disabled={candies < chosen.price}
                />
              )}
              {!isOwned(chosen) && candies < chosen.price && !message && (
                <AppText style={styles.message}>
                  You have {candies} 🍬. You need {chosen.price - candies} more. Answer questions in leaves and tests to
                  get more!
                </AppText>
              )}
              <KidButton label="Close" variant="soft" onPress={() => setChosen(null)} style={styles.darkSoft} />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  intro: {
    color: colors.textSoft,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  tile: {
    width: 168,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: '#E4D4FB',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tileOwned: {
    borderColor: colors.correct,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  tilePreview: {
    height: 134,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.spacePanel,
    borderRadius: radius.sm,
    alignSelf: 'stretch',
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  tileName: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    paddingHorizontal: spacing.xs,
  },
  price: {
    backgroundColor: '#FCE7F3',
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    minHeight: 32,
    justifyContent: 'center',
  },
  priceOwned: {
    backgroundColor: '#DCFCE7',
  },
  priceTooMuch: {
    opacity: 0.7,
  },
  priceText: {
    color: '#9D174D',
    fontFamily: fonts.bold,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  priceTextOwned: {
    color: '#166534',
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
  },
  cardTitle: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: fontSizes.large * 1.3,
    textAlign: 'center',
  },
  bigPreview: {
    alignItems: 'center',
    backgroundColor: colors.spacePanel,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  message: {
    color: colors.textDark,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.body - 2,
    lineHeight: (fontSizes.body - 2) * 1.4,
    textAlign: 'center',
  },
  darkSoft: {
    backgroundColor: colors.leafNext,
  },
});
