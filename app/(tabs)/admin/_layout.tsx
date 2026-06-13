import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { View, Text, StyleSheet } from 'react-native';

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
        name="columnas"
        options={{ title: 'Gestión de Columnas' }}
      />
      <Stack.Screen
        name="usuarios"
        options={{ title: 'Gestión de Usuarios' }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  texto: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  subtexto: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
