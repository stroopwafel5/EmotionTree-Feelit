/**
 * AvatarStudio.tsx
 * --------------------------------------------------------------------------
 * "My look": the child dresses up their own avatar.
 *
 *   Hair       - the hair style (short, long, curly, ponytail, space buns...)
 *   Hair color
 *   Skin       - skin colour
 *   Clothes    - T-shirt colour or a space suit
 *   Extras     - cat ears, glasses, headphones... (as many as they like),
 *                plus the Space Shop items the child bought (guitar, fire
 *                powers...). A "Shop" tile opens the Space Shop.
 *   Face       - how I feel right now (happy, sad, scared, too much...).
 *                The face IS the feeling the child shares with friends,
 *                the same one as in the thought bubble on the home screen.
 *
 * The big avatar at the top changes straight away. Nothing is saved until
 * the child taps "Save my look" (Look.defineLook() checks every choice).
 * Every list comes from src/data/looks.json.
 */
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import AppText from '../components/AppText';
import KidAvatar from '../components/avatar/KidAvatar';
import KidButton from '../components/KidButton';
import OptionTile from '../components/OptionTile';
import StudioTabs, { type StudioTab } from '../components/StudioTabs';
import TopBar from '../components/TopBar';
import { Look, type HumanChoices } from '../models/Look';
import { itemKey } from '../models/Rewards';
import type { User } from '../models/User';
import { feelings } from '../services/feelings';
import { catalog } from '../services/looksCatalog';
import { colors, fontSizes, radius, spacing } from '../theme/theme';

type Tab = 'face' | 'hair' | 'hairColor' | 'skin' | 'outfit' | 'extras';

const TABS: StudioTab<Tab>[] = [
  { id: 'face', icon: '😊', label: 'Face' },
  { id: 'hair', icon: '💇', label: 'Hair' },
  { id: 'hairColor', icon: '🎨', label: 'Hair color' },
  { id: 'skin', icon: '✋', label: 'Skin' },
  { id: 'outfit', icon: '👕', label: 'Clothes' },
  { id: 'extras', icon: '🎀', label: 'Extras' },
];

const HINTS: Record<Tab, string> = {
  face: 'How do you feel right now? Your face shows it.',
  hair: 'Pick your hair.',
  hairColor: 'Pick a hair color.',
  skin: 'Pick a skin color. Fun colors are OK too! 👽',
  outfit: 'Pick your clothes.',
  extras: 'Pick as many extras as you like! Tap again to take one off. Get more in the 🛍️ Shop.',
};

interface AvatarStudioProps {
  user: User;
  /** The saved choices (the studio starts with these). */
  initial: HumanChoices;
  /** Saves the look and the feeling (the face). */
  onSave: (choices: HumanChoices, feeling: string | null) => void;
  /** Leave without saving. */
  onBack: () => void;
  /** Shop items the child bought ("human:guitar"...). */
  owned?: string[];
  /** Save these choices and open the Space Shop. */
  onOpenShop?: (choices: HumanChoices, feeling: string | null) => void;
}

export default function AvatarStudio({ user, initial, onSave, onBack, owned = [], onOpenShop }: AvatarStudioProps) {
  const [choices, setChoices] = useState<HumanChoices>(initial);
  const [feeling, setFeeling] = useState<string | null>(user.feeling);
  const [tab, setTab] = useState<Tab>('face');

  // The look drawn at the top (Look.safeHuman never throws).
  const look = useMemo(() => Look.safeHuman(user.id, choices), [user.id, choices]);
  const changed = JSON.stringify(choices) !== JSON.stringify(initial) || feeling !== user.feeling;

  const set = (part: Partial<HumanChoices>) => setChoices(current => ({ ...current, ...part }));
  const toggleExtra = (id: string) =>
    setChoices(current => ({
      ...current,
      accessories: current.accessories.includes(id)
        ? current.accessories.filter(a => a !== id)
        : [...current.accessories, id],
    }));

  /** A small head preview with one thing changed (for the hair and extras tiles). */
  const headWith = (part: Partial<HumanChoices>) => (
    <KidAvatar look={Look.safeHuman(user.id, { ...choices, ...part })} feeling={feeling} size={72} headOnly />
  );

  const save = () => {
    // defineLook() checks every choice against looks.json.
    Look.human(user.id, choices);
    onSave(choices, feeling);
  };

  const back = () => {
    if (!changed) {
      onBack();
      return;
    }
    Alert.alert('Save your new look?', '', [
      { text: 'No', style: 'cancel', onPress: onBack },
      { text: 'Yes, save it', onPress: save },
    ]);
  };

  const h = catalog.human;
  return (
    <View style={styles.screen}>
      <TopBar title="My look" onBack={back} />

      <View style={styles.preview}>
        <KidAvatar look={look} feeling={feeling} size={170} />
      </View>

      <StudioTabs tabs={TABS} current={tab} onChange={setTab} />
      <AppText style={styles.hint}>{HINTS[tab]}</AppText>

      <ScrollView contentContainerStyle={styles.grid}>
        {tab === 'face' &&
          feelings.map(f => (
            <OptionTile
              key={f.id}
              label={`${f.emoji} ${f.name}`}
              selected={feeling === f.id}
              onPress={() => setFeeling(current => (current === f.id ? null : f.id))}>
              <KidAvatar look={look} feeling={f.id} size={72} headOnly />
            </OptionTile>
          ))}
        {tab === 'hair' &&
          h.hair.map(dec => (
            <OptionTile key={dec.id} label={dec.name} selected={choices.hair === dec.id} onPress={() => set({ hair: dec.id })}>
              {headWith({ hair: dec.id })}
            </OptionTile>
          ))}
        {tab === 'hairColor' &&
          h.hairColor.map(dec => (
            <OptionTile
              key={dec.id}
              label={dec.name}
              color={dec.color}
              selected={choices.hairColor === dec.id}
              onPress={() => set({ hairColor: dec.id })}
            />
          ))}
        {tab === 'skin' &&
          h.skin.map(dec => (
            <OptionTile
              key={dec.id}
              label={dec.name}
              color={dec.color}
              selected={choices.skin === dec.id}
              onPress={() => set({ skin: dec.id })}
            />
          ))}
        {tab === 'outfit' &&
          h.outfit.map(dec => (
            <OptionTile
              key={dec.id}
              label={dec.name}
              selected={choices.outfit === dec.id}
              onPress={() => set({ outfit: dec.id })}
              color={dec.id === 'spacesuit' ? undefined : dec.color}>
              {dec.id === 'spacesuit' ? <AppText style={styles.bigEmoji}>🧑‍🚀</AppText> : null}
            </OptionTile>
          ))}
        {tab === 'extras' &&
          h.accessories
            .filter(dec => !dec.isShopItem() || owned.includes(itemKey(false, dec.id)))
            .map(dec => (
            <OptionTile
              key={dec.id}
              label={dec.name}
              selected={choices.accessories.includes(dec.id)}
              onPress={() => toggleExtra(dec.id)}>
              {headWith({ accessories: [dec.id] })}
            </OptionTile>
          ))}
        {tab === 'extras' && onOpenShop && (
          <OptionTile label="Shop" selected={false} onPress={() => onOpenShop(choices, feeling)}>
            <AppText style={styles.bigEmoji}>🛍️</AppText>
          </OptionTile>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <KidButton label="Save my look ✓" onPress={save} style={styles.saveButton} />
      </View>
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
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  hint: {
    color: colors.textSoft,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  bigEmoji: {
    fontSize: 44,
    lineHeight: 56,
  },
  bottom: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  saveButton: {
    minHeight: 72,
  },
});
