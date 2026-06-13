import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Animated, Easing, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStore } from '@/store/useSyncStore';
import { useAuthStore } from '@/store/useAuthStore';
import { sincronizarTodo } from '@/lib/sync';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SyncIndicator() {
  const { estado, pendientes, ultimaSync, error } = useSyncStore();
  const { usuario, esAdmin } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Animación de rotación cuando está sincronizando
  useEffect(() => {
    if (estado === 'sincronizando') {
      loopRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      rotateAnim.setValue(0);
    }
  }, [estado]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const config: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    idle:          { color: '#94a3b8', icon: 'cloud-outline' },
    sincronizando: { color: '#3b82f6', icon: 'sync' },
    ok:            { color: '#22c55e', icon: 'cloud-done' },
    error:         { color: '#ef4444', icon: 'cloud-offline' },
    sin_internet:  { color: '#f59e0b', icon: 'wifi' },
  };

  const { color, icon } = config[estado] ?? config.idle;

  const handleSincronizar = async () => {
    if (!usuario || estado === 'sincronizando') return;
    await sincronizarTodo(usuario.id, esAdmin);
  };

  const formatSync = (ts: string | null) => {
    if (!ts) return 'Nunca';
    try {
      return format(new Date(ts), "dd/MM HH:mm", { locale: es });
    } catch {
      return ts.substring(0, 16);
    }
  };

  const etiquetaEstado: Record<string, string> = {
    idle:          'Listo',
    sincronizando: 'Sincronizando…',
    ok:            'Sincronizado',
    error:         'Error de sync',
    sin_internet:  'Sin conexión',
  };

  return (
    <>
      {/* Botón en el header */}
      <TouchableOpacity
        style={styles.boton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {estado === 'sincronizando' ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync" size={20} color={color} />
          </Animated.View>
        ) : (
          <Ionicons name={icon} size={20} color={color} />
        )}

        {pendientes > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>
              {pendientes > 99 ? '99+' : pendientes}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal de estado */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modal} onStartShouldSetResponder={() => true}>
            {/* Título */}
            <View style={styles.modalHeader}>
              <Ionicons name={icon} size={24} color={color} />
              <Text style={styles.modalTitulo}>Sincronización</Text>
            </View>

            {/* Estado */}
            <View style={styles.fila}>
              <Text style={styles.filaEtiqueta}>Estado</Text>
              <Text style={[styles.filaValor, { color }]}>
                {etiquetaEstado[estado] ?? estado}
              </Text>
            </View>

            {/* Pendientes */}
            <View style={styles.fila}>
              <Text style={styles.filaEtiqueta}>Pendientes</Text>
              <Text style={[styles.filaValor, pendientes > 0 && { color: '#f59e0b' }]}>
                {pendientes} {pendientes === 1 ? 'registro' : 'registros'}
              </Text>
            </View>

            {/* Última sync */}
            <View style={styles.fila}>
              <Text style={styles.filaEtiqueta}>Última sync</Text>
              <Text style={styles.filaValor}>{formatSync(ultimaSync)}</Text>
            </View>

            {/* Error si existe */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTexto}>{error}</Text>
              </View>
            )}

            {/* Botones */}
            <TouchableOpacity
              style={[styles.btnSync, estado === 'sincronizando' && styles.btnDisabled]}
              onPress={handleSincronizar}
              disabled={estado === 'sincronizando'}
              activeOpacity={0.8}
            >
              {estado === 'sincronizando'
                ? <ActivityIndicator color="#ffffff" size="small" />
                : <Text style={styles.btnSyncTexto}>🔄 Sincronizar ahora</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCerrar} onPress={() => setModalVisible(false)}>
              <Text style={styles.btnCerrarTexto}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#ef4444', borderRadius: 8,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeTexto: { color: '#fff', fontSize: 9, fontWeight: '700' },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start', alignItems: 'flex-end',
    paddingTop: 60, paddingRight: 12,
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 20,
    width: 280,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
  },
  modalTitulo: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  fila: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  filaEtiqueta: { fontSize: 13, color: '#64748b' },
  filaValor: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  errorBox: {
    backgroundColor: '#fef2f2', borderRadius: 8, padding: 10, marginTop: 10,
  },
  errorTexto: { fontSize: 11, color: '#dc2626' },
  btnSync: {
    backgroundColor: '#1e40af', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { backgroundColor: '#93c5fd' },
  btnSyncTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnCerrar: {
    borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', marginTop: 8,
  },
  btnCerrarTexto: { color: '#64748b', fontWeight: '600', fontSize: 14 },
});