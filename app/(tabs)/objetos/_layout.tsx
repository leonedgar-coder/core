import { Stack } from 'expo-router';
import SyncIndicator from '@/components/SyncIndicator';

const headerComun = {
  headerStyle: { backgroundColor: '#ffffff' },
  headerTitleStyle: { fontWeight: '700' as const, color: '#0f172a', fontSize: 17 },
  headerTintColor: '#1e40af',
  headerRight: () => <SyncIndicator />,
  headerRightContainerStyle: { paddingRight: 12 },
};

export default function ObjetosLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ ...headerComun, title: 'Objetos', headerBackVisible: false }}
      />
      <Stack.Screen
        name="nueva"
        options={{ ...headerComun, title: 'Nuevo Objeto' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ ...headerComun, title: 'Detalle' }}
      />
    </Stack>
  );
}
