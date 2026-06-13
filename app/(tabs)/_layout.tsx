import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import SyncIndicator from '@/components/SyncIndicator';

export default function TabsLayout() {
  const { esAdmin } = useAuthStore();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1e40af',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          // Altura base + padding inferior del safe area (barra navegación Android)
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOpacity: 0.06,
          elevation: 2,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: '#0f172a',
          fontSize: 17,
        },
        // Padding superior para la barra de estado
        headerStatusBarHeight: insets.top,
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