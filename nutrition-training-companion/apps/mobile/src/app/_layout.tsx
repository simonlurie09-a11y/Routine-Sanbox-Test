/* Root: providers, the overlay host, and the stack every screen is pushed on.
   Sign-up shows until it's finished ((tabs)/_layout redirects there). */
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState as RNAppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/debug';
import { syncHealth } from '@/services/healthSync';
import { colors } from '@/theme';
import { OverlayHost } from '@/ui';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    syncHealth();
    const sub = RNAppState.addEventListener('change', (st) => { if (st === 'active') syncHealth(); });
    return () => sub.remove();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="sign-up" options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="scanner" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="change-request" options={{ presentation: 'modal' }} />
          <Stack.Screen name="training/edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="workout/[key]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="food/quick-add" options={{ presentation: 'modal' }} />
        </Stack>
        <OverlayHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
