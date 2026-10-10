/**
 * App.tsx
 * --------------------------------------------------------------------------
 * The root of the app. It decides which screen to show:
 *
 *   app opens
 *     -> is someone logged in on this device? (authService.getCurrentUser)
 *        no  -> LoginScreen  (grown-up logs in or makes an account)
 *        yes -> MainScreen   ("Let's Start" -> tree -> levels)
 *
 * Every screen sits on the same calm space background, and inside the
 * "safe area" (so nothing hides under the phone's status bar, notch or
 * navigation buttons).
 *
 * We do not use a navigation library on purpose: the app has only a few
 * screens, and simple state is easier to read and change.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import SpaceBackground from './src/components/SpaceBackground';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import { authService, type Account } from './src/services/authService';
import { colors } from './src/theme/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      {/* White status bar icons on the dark space background. */}
      <StatusBar barStyle="light-content" />
      <SpaceBackground>
        <AppContent />
      </SpaceBackground>
    </SafeAreaProvider>
  );
}

/** Picks the screen. Lives inside SafeAreaProvider so it can read insets. */
function AppContent() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<Account | null>(null);
  // True while we check if someone is already logged in.
  const [checking, setChecking] = useState(true);

  // When the app opens: is someone still logged in from last time?
  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  /** Log out, then go back to the LoginScreen. */
  const logOut = () => {
    authService.logOut().finally(() => setUser(null));
  };

  // Keep everything inside the safe area.
  const safeArea = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  return (
    <View style={[styles.flex, safeArea]}>
      {checking ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.purpleGlow} />
        </View>
      ) : user ? (
        // `key` gives each child a fresh MainScreen (their own tree).
        <MainScreen key={user.id} user={user} onLogOut={logOut} />
      ) : (
        <LoginScreen onLoggedIn={setUser} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
