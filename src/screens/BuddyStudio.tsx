/**
 * BuddyStudio.tsx
 * --------------------------------------------------------------------------
 * "My buddy": the child designs their space buddy.
 *
 *   Buddy   - a cat, a dog or a green alien
 *   Face    - smile, big grin, silly, love, wow, sleepy, frown, grumpy,
 *             or "Same as me" (the buddy copies the child's feeling)
 *   Style   - depends on the buddy (stripes, floppy ears, three eyes...)
 *   Color
 *   Extras  - space helmet, scarf, bow tie, crown (as many as they like),
 *             plus the Space Shop items the child bought. A "Shop" tile
 *             opens the Space Shop.
 *   Name    - tap the name under the buddy to change it
 *
 * Nothing is saved until "Save my buddy". Every list comes from
 * src/data/looks.json.
 */
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../components/AppText';
import BuddyAvatar from '../components/avatar/BuddyAvatar';
import KidButton from '../components/KidButton';
import OptionTile from '../components/OptionTile';
import StudioTabs, { type StudioTab } from '../components/StudioTabs';
import TextEntryModal from '../components/TextEntryModal';
import TopBar from '../components/TopBar';
import { Pet, type PetJson } from '../models/Pet';
import { itemKey } from '../models/Rewards';
import type { User } from '../models/User';
import { catalog } from '../services/looksCatalog';
import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';

type Tab = 'kind' | 'face' | 'style' | 'color' | 'extras';

const TABS: StudioTab<Tab>[] = [
  { id: 'kind', icon: '🐾', label: 'Buddy' },
  { id: 'face', icon: '😊', label: 'Face' },
  { id: 'style', icon: '✨', label: 'Style' },
  { id: 'color', icon: '🎨', label: 'Color' },
  { id: 'extras', icon: '🎩', label: 'Extras' },
];

const HINTS: Record<Tab, string> = {
  kind: 'Who is your space buddy?',
  face: 'Pick a face. 🪞 "Same as me" = your buddy feels what you feel!',
  style: 'Pick a style.',
  color: 'Pick a color.',
  extras: 'Pick as many extras as you like! Tap again to take one off. Get more in the 🛍️ Shop.',
};

/** Name ideas, so nobody has to type if they don't want to. */
const NAME_IDEAS = ['Comet', 'Nova', 'Luna', 'Pixel', 'Zib Jr.', 'Orbit', 'Sparkle', 'Biscuit'];

interface BuddyStudioProps {
  user: User;
  initial: PetJson;
  onSave: (pet: PetJson) => void;
  onBack: () => void;
  /** Shop items the child bought ("pet:petShades"...). */
  owned?: string[];
  /** Save the buddy and open the Space Shop. */
  onOpenShop?: (pet: PetJson) => void;
}

export default function BuddyStudio({ user, initial, onSave, onBack, owned = [], onOpenShop }: BuddyStudioProps) {
  const [pet, setPet] = useState<PetJson>(initial);
  const [tab, setTab] = useState<Tab>('kind');
  const [naming, setNaming] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const buddy = useMemo(() => Pet.fromJson(user.id, pet), [user.id, pet]);
  const changed = JSON.stringify(pet) !== JSON.stringify(initial);

  const set = (part: Partial<PetJson>) => setPet(current => ({ ...current, ...part }));
  const toggleExtra = (id: string) =>
    setPet(current => ({
      ...current,
      accessories: current.accessories.includes(id)
        ? current.accessories.filter(a => a !== id)
        : [...current.accessories, id],
    }));

  /** A new buddy kind starts with that kind's first style. */
  const pickKind = (kind: string) => {
    const firstStyle = catalog.pet.styles[kind]?.[0]?.id ?? pet.style;
    set({ kind, style: kind === pet.kind ? pet.style : firstStyle });
  };

  /** A small buddy with one thing changed (for the tiles). */
  const buddyWith = (part: Partial<PetJson>) => (
    <BuddyAvatar pet={Pet.fromJson(user.id, { ...pet, ...part })} size={70} ownerFeeling={user.feeling} />
  );

  const rename = (name: string) => {
    const problem = new Pet(user.id, user.id, pet.name, buddy.look).rename(name);
    if (problem) {
      setNameError(problem);
      return;
    }
    setNameError(null);
    setNaming(false);
    set({ name: name.trim() });
  };

  const save = () => onSave(buddy.toJson());

  const back = () => {
    if (!changed) {
      onBack();
      return;
    }
    Alert.alert('Save your buddy?', '', [
      { text: 'No', style: 'cancel', onPress: onBack },
      { text: 'Yes, save', onPress: save },
    ]);
  };

  const p = catalog.pet;
  return (
    <View style={styles.screen}>
      <TopBar title="My space buddy" onBack={back} />

      <View style={styles.preview}>
        <BuddyAvatar pet={buddy} size={150} ownerFeeling={user.feeling} />
        <Pressable
          onPress={() => {
            setNameError(null);
            setNaming(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Name: ${buddy.name}. Tap to change.`}
          style={({ pressed }) => [styles.nameTag, pressed && styles.pressed]}>
          <AppText style={styles.nameText} numberOfLines={1}>
            {buddy.name} ✏️
          </AppText>
        </Pressable>
      </View>

      <StudioTabs tabs={TABS} current={tab} onChange={setTab} />
      <AppText style={styles.hint}>{HINTS[tab]}</AppText>

      <ScrollView contentContainerStyle={styles.grid}>
        {tab === 'kind' &&
          p.kinds.map(dec => (
            <OptionTile key={dec.id} label={dec.name} selected={pet.kind === dec.id} onPress={() => pickKind(dec.id)}>
              {buddyWith({ kind: dec.id, style: p.styles[dec.id]?.[0]?.id })}
            </OptionTile>
          ))}
        {tab === 'face' &&
          p.moods.map(dec => (
            <OptionTile key={dec.id} label={dec.name} selected={(pet.mood ?? 'happy') === dec.id} onPress={() => set({ mood: dec.id })}>
              {buddyWith({ mood: dec.id })}
            </OptionTile>
          ))}
        {tab === 'style' &&
          (p.styles[pet.kind] ?? []).map(dec => (
            <OptionTile key={dec.id} label={dec.name} selected={pet.style === dec.id} onPress={() => set({ style: dec.id })}>
              {buddyWith({ style: dec.id })}
            </OptionTile>
          ))}
        {tab === 'color' &&
          p.colors.map(dec => (
            <OptionTile
              key={dec.id}
              label={dec.name}
              color={dec.color}
              selected={pet.color === dec.id}
              onPress={() => set({ color: dec.id })}
            />
          ))}
        {tab === 'extras' &&
          p.accessories
            .filter(dec => !dec.isShopItem() || owned.includes(itemKey(true, dec.id)))
            .map(dec => (
            <OptionTile
              key={dec.id}
              label={dec.name}
              selected={pet.accessories.includes(dec.id)}
              onPress={() => toggleExtra(dec.id)}>
              {buddyWith({ accessories: [dec.id] })}
            </OptionTile>
          ))}
        {tab === 'extras' && onOpenShop && (
          <OptionTile label="Shop" selected={false} onPress={() => onOpenShop(buddy.toJson())}>
            <AppText style={styles.bigEmoji}>🛍️</AppText>
          </OptionTile>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <KidButton label="Save my buddy ✓" onPress={save} style={styles.saveButton} />
      </View>

      <TextEntryModal
        visible={naming}
        title="Your buddy's name"
        initialValue={buddy.name}
        placeholder="Type a name"
        maxLength={16}
        doneLabel="OK"
        onDone={rename}
        onCancel={() => setNaming(false)}
        error={nameError}
        suggestions={NAME_IDEAS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  preview: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: colors.spacePanel,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  nameTag: {
    backgroundColor: colors.card,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
    maxWidth: 220,
  },
  nameText: {
    color: colors.textDark,
    fontFamily: fonts.bold,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * 1.35,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  hint: {
    color: colors.textSoft,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  bigEmoji: {
    fontSize: 44,
    lineHeight: 56,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  bottom: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  saveButton: {
    minHeight: 72,
  },
});
