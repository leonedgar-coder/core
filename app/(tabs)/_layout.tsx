import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';

export default function TabsLayout() {
  const { esAdmin } = useAuthStore();
  const insets = useSafeAreaInsets();

  // El inset.bottom da la altura de la barra de navegación del sistema (0-48dp típico)
  // Usamos clamp para no exceder 60dp (valores anómalos de SafeArea en algunos dispositivos)
  const safeBottom = Platform.OS === 'android'
    ? Math.min(Math.max(insets.bottom, 0), 60)
    : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1e40af',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          // SIN position:absolute — dejamos que React Navigation maneje el layout
          // La altura se calcula sumando la barra de sistema
          height: 56 + safeBottom,
          paddingBottom: safeBottom + 4,
          paddingTop: 6,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        // Los Stack internos manejan sus propios headers
        headerShown: false,
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