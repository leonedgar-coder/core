import { Stack } from 'expo-router';
import HeaderActions from '@/components/HeaderActions';

const headerComun = {
  headerStyle: { backgroundColor: '#ffffff' },
  headerTitleStyle: { fontWeight: '700' as const, color: '#0f172a', fontSize: 17 },
  headerTintColor: '#1e40af',
  // Nube + Engrane juntos, sin solapamiento
  headerRight: () => <HeaderActions />,
  headerRightContainerStyle: { paddingRight: 4 },
};

export default function PersonasLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ ...headerComun, title: 'Personas', headerBackVisible: false }}
      />
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
