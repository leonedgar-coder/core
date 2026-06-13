import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import SyncIndicator from '@/components/SyncIndicator';

// Altura fija y segura para la tab bar en Android
// StatusBar.currentHeight da la altura de la barra de estado (que ya no es translucent)
// La barra de navegación del sistema suele ser 0-48dp según el modo del dispositivo
const TAB_BAR_HEIGHT = 60;
const BOTTOM_PADDING = Platform.OS === 'android' ? 8 : 20;

export default function TabsLayout() {
  const { esAdmin } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1e40af',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: TAB_BAR_HEIGHT,
          paddingBottom: BOTTOM_PADDING,
          paddingTop: 6,
          elevation: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        // Cada Stack interno maneja su propio header
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