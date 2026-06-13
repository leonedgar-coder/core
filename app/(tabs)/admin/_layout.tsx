import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { View, Text, StyleSheet } from 'react-native';
import HeaderActions from '@/components/HeaderActions';

const headerComun = {
  headerStyle: { backgroundColor: '#ffffff' },
  headerTitleStyle: { fontWeight: '700' as const, color: '#0f172a', fontSize: 17 },
  headerTintColor: '#1e40af',
  headerRight: () => <HeaderActions />,
  headerRightContainerStyle: { paddingRight: 4 },
};

export default function AdminLayout() {
  const { esAdmin } = useAuthStore();

  if (!esAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.texto}>Sin acceso</Text>
        <Text style={styles.subtexto}>Esta sección es solo para administradores.</Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ ...headerComun, title: 'Administración', headerBackVisible: false }}
      />
      <Stack.Screen
        name="columnas"
        options={{ ...headerComun, title: 'Columnas extra' }}
      />
      <Stack.Screen
        name="usuarios"
        options={{ ...headerComun, title: 'Usuarios' }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  texto: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  subtexto: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
