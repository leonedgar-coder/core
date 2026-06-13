/**
 * HeaderActions — Fila de botones para el headerRight de cada Stack.
 * Muestra: [SyncIndicator (nube)] [Admin (engrane, solo si esAdmin)]
 * Ambos botones visibles y separados, sin solapamiento.
 */
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import SyncIndicator from './SyncIndicator';

export default function HeaderActions() {
  const router = useRouter();
  const { esAdmin } = useAuthStore();

  return (
    <View style={styles.fila}>
      {/* Nube — SyncIndicator */}
      <SyncIndicator />

      {/* Engrane Admin — solo para admins */}
      {esAdmin && (
        <TouchableOpacity
          style={styles.boton}
          onPress={() => router.push('/(tabs)/admin/columnas')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={22} color="#1e40af" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 4,
  },
  boton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
