import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import SyncIndicator from '@/components/SyncIndicator';

export default function TabsLayout() {
  const { esAdmin } = useAuthStore();
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);

  // Opciones del header compartido para pantallas index de cada tab
  const headerIndex = {
    headerStyle: { backgroundColor: '#ffffff' },
    headerTitleStyle: { fontWeight: '700' as const, color: '#0f172a', fontSize: 17 },
    // SyncIndicator en el header de los índices de tab
    headerRight: () => <SyncIndicator />,
    headerRightContainerStyle: { paddingRight: 12 },
    headerShadowVisible: false,
  };

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
        // SIN headerRight global — cada tab lo declara por separado
        headerShown: false, // Los Stack de cada tab manejan sus propios headers
      }}
    >
      <Tabs.Screen
        name="personas"
        options={{
          title: 'Personas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          // El header del tab se configura en personas/_layout.tsx
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