import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Platform, StatusBar, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { iniciarListenerRed } from '@/lib/sync';

// En Android, desactivar translucent hace que el sistema empuje
// el contenido hacia abajo de la barra de estado automáticamente.
if (Platform.OS === 'android') {
  StatusBar.setTranslucent(false);
  StatusBar.setBackgroundColor('#ffffff');
  StatusBar.setBarStyle('dark-content');
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { usuario, sesionCargando, verificarSesion, esAdmin } = useAuthStore();
  const listenerCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    verificarSesion();
  }, []);

  // Iniciar listener de red cuando el usuario tiene sesión activa
  useEffect(() => {
    if (usuario) {
      // Limpiar listener anterior si existe
      listenerCleanupRef.current?.();
      listenerCleanupRef.current = iniciarListenerRed(usuario.id, esAdmin);
    } else {
      // Al cerrar sesión, detener listener
      listenerCleanupRef.current?.();
      listenerCleanupRef.current = null;
    }
    return () => {
      listenerCleanupRef.current?.();
    };
  }, [usuario?.id]);

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