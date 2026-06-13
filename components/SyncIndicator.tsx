import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStore } from '@/store/useSyncStore';

/**
 * SyncIndicator — aparece en el header derecho de cada tab.
 * Muestra el estado de sincronización y la cantidad de registros pendientes.
 * En el futuro (Fase 7) disparará la sincronización al tocar.
 */
export default function SyncIndicator() {
  const { estado, pendientes, error } = useSyncStore();

  // Color e ícono según estado
  const config = {
    idle:          { color: '#94a3b8', icon: 'cloud-outline' as const },
    sincronizando: { color: '#3b82f6', icon: 'sync'          as const },
    ok:            { color: '#22c55e', icon: 'cloud-done'     as const },
    error:         { color: '#ef4444', icon: 'cloud-offline'  as const },
    sin_internet:  { color: '#f59e0b', icon: 'wifi'          as const },
  };

  const { color, icon } = config[estado] ?? config.idle;

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={color} />
      {pendientes > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>
            {pendientes > 99 ? '99+' : pendientes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTexto: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
});