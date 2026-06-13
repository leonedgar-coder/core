import { Stack } from 'expo-router';
import SyncIndicator from '@/components/SyncIndicator';

// Padding para que el contenido no quede oculto bajo la tab bar fija
const CONTENT_BOTTOM = 60;

const headerComun = {
  headerStyle: { backgroundColor: '#ffffff' },
  headerTitleStyle: { fontWeight: '700' as const, color: '#0f172a', fontSize: 17 },
  headerTintColor: '#1e40af',
  headerRight: () => <SyncIndicator />,
  headerRightContainerStyle: { paddingRight: 12 },
};

export default function PersonasLayout() {
  return (
    <Stack>
      {/* index: el Tab header lo maneja, el Stack NO muestra header */}
      <Stack.Screen
        name="index"
        options={{ ...headerComun, title: 'Personas', headerBackVisible: false }}
      />
      {/* nueva y [id]: el Stack muestra su propio header con SyncIndicator */}
      <Stack.Screen
        name="nueva"
        options={{ ...headerComun, title: 'Nueva Persona' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ ...headerComun, title: 'Detalle' }}
      />
    </Stack>
  );
}
