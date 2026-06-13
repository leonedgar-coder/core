import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import SyncIndicator from '@/components/SyncIndicator';

export default function TabsLayout() {
  const { esAdmin } = useAuthStore();
  const insets = useSafeAreaInsets();

  // En Android con translucent=false, el top ya está manejado por el StatusBar.
  // Para el bottom usamos el inset real; si es 0 (dispositivo sin barra virtual),
  // agregamos 8dp de padding mínimo.
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1e40af',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 56 + bottomPadding,
          paddingBottom: bottomPadding + 4,
          paddingTop: 6,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 2,
          shadowOpacity: 0.06,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#0f172a',
          fontSize: 17,
        },
        // NO poner headerStatusBarHeight — lo maneja translucent=false
        headerRight: () => <SyncIndicator />,
        headerRightContainerStyle: { paddingRight: 12 },
      }}
    >
      <Tabs.Screen
        name="personas"
        options={{
          title: 'Personas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="objetos"
        options={{
          title: 'Objetos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
          href: esAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}