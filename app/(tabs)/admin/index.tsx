import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminIndex() {
  const router = useRouter();

  const opciones = [
    {
      titulo: 'Columnas extra',
      descripcion: 'Gestionar campos personalizados para personas y objetos',
      icono: 'grid-outline' as const,
      ruta: '/(tabs)/admin/columnas',
    },
    {
      titulo: 'Usuarios',
      descripcion: 'Invitar, cambiar rol y desactivar usuarios',
      icono: 'people-outline' as const,
      ruta: '/(tabs)/admin/usuarios',
    },
  ];

  return (
    <View style={styles.contenedor}>
      <Text style={styles.subtitulo}>Panel de administración</Text>
      {opciones.map(op => (
        <TouchableOpacity
          key={op.ruta}
          style={styles.card}
          onPress={() => router.push(op.ruta as never)}
          activeOpacity={0.8}
        >
          <View style={styles.cardIcono}>
            <Ionicons name={op.icono} size={26} color="#1e40af" />
          </View>
          <View style={styles.cardTexto}>
            <Text style={styles.cardTitulo}>{op.titulo}</Text>
            <Text style={styles.cardDesc}>{op.descripcion}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  subtitulo: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 16, marginTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    gap: 14,
  },
  cardIcono: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
  },
  cardTexto: { flex: 1 },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  cardDesc: { fontSize: 12, color: '#64748b' },
});
