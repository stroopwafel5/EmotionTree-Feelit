/**
 * PhotoCard.tsx
 * --------------------------------------------------------------------------
 * Shows one real photo from the photo database, with a link to its source.
 *
 * - The photo is loaded from the internet (its `uri` in photos.json).
 * - Under the photo there is a small link: "📷 Photo: Pexels (see source)".
 *   Tapping it opens the photo's page, so every photo is credited.
 * - While loading we show a spinner. If the photo cannot load (no internet,
 *   or the photo was removed), we show a friendly message instead of a
 *   broken image - and the source link still works.
 * - The photo's description is read out by screen readers.
 *
 * Usage:
 *   <PhotoCard photoId="happy-1" height={260} />
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { getPhoto } from '../services/photoLibrary';
import { colors, fontSizes, fonts, radius, spacing } from '../theme/theme';
import AppText from './AppText';

interface PhotoCardProps {
  /** Photo id from photos.json, e.g. "happy-1". */
  photoId: string;
  /** Height of the photo in pixels. */
  height?: number;
  /** Width of the card. Defaults to the full width it is given. */
  width?: number;
}

export default function PhotoCard({
  photoId,
  height = 240,
  width,
}: PhotoCardProps) {
  const photo = getPhoto(photoId);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  /** Opens the page the photo comes from in the phone's browser. */
  const openSource = () => {
    if (photo) {
      Linking.openURL(photo.source).catch(() => {
        // If no browser can open it, there is nothing else to do.
      });
    }
  };

  return (
    <View style={[styles.card, width ? { width } : styles.fullWidth]}>
      <View style={[styles.frame, { height }]}>
        {photo && !failed ? (
          <Image
            source={{ uri: photo.uri }}
            style={styles.image}
            resizeMode="cover"
            accessible
            accessibilityRole="image"
            accessibilityLabel={photo.description}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setFailed(true);
              setLoading(false);
            }}
          />
        ) : (
          <View style={styles.fallback}>
            <AppText style={styles.fallbackIcon}>🖼️</AppText>
            <AppText style={styles.fallbackText}>
              {photo
                ? 'The photo could not load. Is the internet on?'
                : `Photo "${photoId}" is missing from photos.json.`}
            </AppText>
          </View>
        )}

        {/* Spinner on top of the photo while it is still loading. */}
        {loading && photo && !failed && (
          <View style={styles.spinner} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.purpleBright} />
          </View>
        )}
      </View>

      {/* The source link that credits the photo. */}
      {photo && (
        <Pressable
          onPress={openSource}
          accessibilityRole="link"
          accessibilityLabel={`Photo from ${photo.site}. Open the source page.`}
          hitSlop={8}>
          <AppText style={styles.credit}>
            📷 Photo: {photo.site}{' '}
            <AppText style={styles.link}>(see source)</AppText>
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 3,
    borderColor: colors.purpleGlow,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  frame: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: '#E9DDFB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  spinner: {
    // Covers the whole photo frame. (Written out by hand because
    // StyleSheet.absoluteFillObject was removed in React Native 0.87.)
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  fallbackIcon: {
    fontSize: 40,
    lineHeight: 52,
  },
  fallbackText: {
    color: colors.textDark,
    textAlign: 'center',
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.4,
  },
  credit: {
    marginTop: spacing.xs,
    color: colors.textDark,
    fontSize: fontSizes.small - 2,
    lineHeight: (fontSizes.small - 2) * 1.5,
    textAlign: 'center',
  },
  link: {
    fontFamily: fonts.semiBold,
    color: colors.purpleBright,
    textDecorationLine: 'underline',
    fontSize: fontSizes.small - 2,
  },
});
