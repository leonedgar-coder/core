import { View } from 'react-native';
import { Stack } from 'expo-router';
import HeaderActions from '@/components/HeaderActions';
import BtnExportar from '@/components/BtnExportar';

// Fila derecha del header: exportar + nube
const PersonasHeaderRight = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: 4 }}>
    <BtnExportar tabla="personas" />
    <HeaderActions />
  </View>
);

const headerComun = {
  headerStyle: { backgroundColor: '#ffffff' },
  headerTitleStyle: { fontWeight: '700' as const, color: '#0f172a', fontSize: 17 },
  headerTintColor: '#1e40af',
  headerRight: PersonasHeaderRight,
  headerRightContainerStyle: { paddingRight: 0 },
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
