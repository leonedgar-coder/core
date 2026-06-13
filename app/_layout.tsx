import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { usuario, sesionCargando, verificarSesion } = useAuthStore();

  useEffect(() => {
    verificarSesion();
  }, []);

  useEffect(() => {
    if (sesionCargando) return;

    const enAuth = segments[0] === '(auth)';

    if (!usuario && !enAuth) {
      router.replace('/(auth)/login');
    } else if (usuario && enAuth) {
      router.replace('/(tabs)/personas');
    }
  }, [usuario, sesionCargando, segments]);

  if (sesionCargando) {
    return (
      <SafeAreaProvider>
        <View style={styles.splash}>
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
});