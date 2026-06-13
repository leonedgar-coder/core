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

  // Guard de autenticación: redirigir según estado
  useEffect(() => {
    if (sesionCargando) return; // Esperar a que termine la verificación

    const enAuth = segments[0] === '(auth)';

    if (!usuario && !enAuth) {
      // No autenticado fuera de auth → ir a login
      router.replace('/(auth)/login');
    } else if (usuario && enAuth) {
      // Autenticado dentro de auth → ir a tabs
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
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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