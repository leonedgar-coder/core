import { View } from 'react-native';
import { Stack } from 'expo-router';
import HeaderActions from '@/components/HeaderActions';
import BtnExportar from '@/components/BtnExportar';

// Fila derecha del header: exportar + nube
const ObjetosHeaderRight = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: 4 }}>
    <BtnExportar tabla="objetos" />
    <HeaderActions />
  </View>
);

const headerComun = {
  headerStyle: { backgroundColor: '#ffffff' },
  headerTitleStyle: { fontWeight: '700' as const, color: '#0f172a', fontSize: 17 },
  headerTintColor: '#1e40af',
  headerRight: ObjetosHeaderRight,
  headerRightContainerStyle: { paddingRight: 0 },
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
