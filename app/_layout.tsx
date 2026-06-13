import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { usuario, sesionCargando, verificarSesion } = useAuthStore();

  // Verificar sesión al montar la app (una sola vez)
  useEffect(() => {
    verificarSesion();
  }, []);

  // Guard de autenticación
  useEffect(() => {
    if (sesionCargando) return;

    const enAuth = segments[0] === '(auth)';

    if (!usuario && !enAuth) {
      router.replace('/(auth)/login');
    } else if (usuario && enAuth) {
      router.replace('/(tabs)/personas');
    }
  }, [usuario, sesionCargando, segments]);

  // Splash mientras verifica sesión
  if (sesionCargando) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
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