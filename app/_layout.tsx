import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/authStore';
import LoadingScreen from '../src/components/LoadingScreen';

export default function RootLayout() {
  const { isLoading, isAuthenticated, loadUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!isAuthenticated && inTabsGroup) {
      router.replace('/(auth)/login');
    } else if (!isAuthenticated && segments.length === 0) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && segments.length === 0) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, segments]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <LoadingScreen message="MyShifters" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
