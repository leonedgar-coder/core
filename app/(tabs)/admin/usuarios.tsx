/**
 * app/(tabs)/admin/usuarios.tsx — Gestión de usuarios (Fase 10.2)
 * Lista, invita, cambia rol y desactiva usuarios via Edge Function
 */
import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface UsuarioAdmin {
  id: string;
  email: string;
  rol: 'admin' | 'usuario';
  creado_en: string;
  ultimo_acceso: string | null;
  activo: boolean;
}

// ---------------------------------------------------------------------------
// Helper: llamar Edge Function con el token del usuario actual
// ---------------------------------------------------------------------------
async function llamarEdgeFunction(path: string, method = 'GET', body?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sin sesión activa');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const url = `${supabaseUrl}/functions/v1/admin-usuarios${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
  return json;
}

// ---------------------------------------------------------------------------
export default function UsuariosScreen() {
  const { esAdmin, usuario: yo } = useAuthStore();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cargando, setCargando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cargadoPrimero, setCargadoPrimero] = useState(false);

  // Modal invitar
  const [modalInvitar, setModalInvitar] = useState(false);
  const [emailNuevo, setEmailNuevo] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!esAdmin) {
    return (
      <View style={styles.sinAcceso}>
        <Ionicons name="lock-closed" size={48} color="#94a3b8" />
        <Text style={styles.sinAccesoTitulo}>Sin acceso</Text>
        <Text style={styles.sinAccesoSub}>Esta sección es solo para administradores.</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  const cargar = useCallback(async (esRefresh = false) => {
    if (esRefresh) setRefreshing(true);
    else setCargando(true);
    try {
      const data = await llamarEdgeFunction('/');
      setUsuarios(data.usuarios ?? []);
      setCargadoPrimero(true);
    } catch (e: unknown) {
      Alert.alert('Error al cargar usuarios', e instanceof Error ? e.message : String(e));
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  // ✅ Cargar al montar en useEffect — nunca llamar setState en el cuerpo del render
  useEffect(() => {
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Invitar usuario
  const invitar = async () => {
    if (!emailNuevo.trim() || !emailNuevo.includes('@')) {
      Alert.alert('Error', 'Ingresa un email válido');
      return;
    }
    setEnviando(true);
    try {
      await llamarEdgeFunction('/invitar', 'POST', { email: emailNuevo.trim() });
      Alert.alert('✅ Invitación enviada', `Se envió un correo a ${emailNuevo.trim()}`);
      setModalInvitar(false);
      setEmailNuevo('');
      await cargar();
    } catch (e: unknown) {
      Alert.alert('Error al invitar', e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Cambiar rol
  const cambiarRol = (u: UsuarioAdmin) => {
    const nuevoRol = u.rol === 'admin' ? 'usuario' : 'admin';
    Alert.alert(
      'Cambiar rol',
      `¿Cambiar a "${u.email}" al rol "${nuevoRol}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar', onPress: async () => {
            try {
              await llamarEdgeFunction('/cambiar-rol', 'POST', { userId: u.id, nuevoRol });
              await cargar();
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : String(e));
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // Desactivar usuario
  const desactivar = (u: UsuarioAdmin) => {
    Alert.alert(
      'Desactivar usuario',
      `¿Desactivar la cuenta de "${u.email}"? El usuario no podrá iniciar sesión.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar', style: 'destructive', onPress: async () => {
            try {
              await llamarEdgeFunction('/desactivar', 'POST', { userId: u.id });
              await cargar();
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : String(e));
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // Formato de fecha corta
  const fmtFecha = (ts: string | null) => {
    if (!ts) return '—';
    try { return format(new Date(ts), 'dd/MM/yy HH:mm', { locale: es }); }
    catch { return ts.substring(0, 10); }
  };

  // ---------------------------------------------------------------------------
  // Render de un ítem de usuario
  const renderUsuario = (u: UsuarioAdmin) => {
    const esSoYo = u.id === yo?.id;

    return (
      <View key={u.id} style={[styles.item, !u.activo && styles.itemInactivo]}>
        {/* Avatar */}
        <View style={[styles.avatar, u.rol === 'admin' && styles.avatarAdmin]}>
          <Text style={styles.avatarLetra}>
            {(u.email?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.infoFila}>
            <Text style={styles.email} numberOfLines={1}>{u.email}</Text>
            {esSoYo && <Text style={styles.badgeTu}> tú</Text>}
          </View>
          <View style={styles.metaFila}>
            <View style={[styles.rolBadge, u.rol === 'admin' && styles.rolAdmin]}>
              <Text style={[styles.rolTexto, u.rol === 'admin' && styles.rolAdminTexto]}>
                {u.rol}
              </Text>
            </View>
            {!u.activo && (
              <View style={styles.inactivoBadge}>
                <Text style={styles.inactivoTexto}>Inactivo</Text>
              </View>
            )}
          </View>
          <Text style={styles.meta}>Creado: {fmtFecha(u.creado_en)}</Text>
          <Text style={styles.meta}>Último acceso: {fmtFecha(u.ultimo_acceso)}</Text>
        </View>

        {/* Acciones (no para uno mismo) */}
        {!esSoYo && (
          <View style={styles.acciones}>
            <TouchableOpacity
              style={styles.accionBtn}
              onPress={() => cambiarRol(u)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={u.rol === 'admin' ? 'person-outline' : 'shield-outline'}
                size={18}
                color="#1e40af"
              />
            </TouchableOpacity>
            {u.activo && (
              <TouchableOpacity
                style={styles.accionBtn}
                onPress={() => desactivar(u)}
                activeOpacity={0.7}
              >
                <Ionicons name="ban-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  return (
    <View style={styles.contenedor}>
      {cargando && !cargadoPrimero ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1e40af" size="large" />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 12, paddingTop: 8 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => cargar(true)} colors={['#1e40af']} />
          }
        >
          {/* Resumen */}
          <View style={styles.resumen}>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenNum}>{usuarios.length}</Text>
              <Text style={styles.resumenLabel}>Total</Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={[styles.resumenNum, { color: '#1e40af' }]}>
                {usuarios.filter(u => u.rol === 'admin').length}
              </Text>
              <Text style={styles.resumenLabel}>Admins</Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={[styles.resumenNum, { color: '#22c55e' }]}>
                {usuarios.filter(u => u.activo).length}
              </Text>
              <Text style={styles.resumenLabel}>Activos</Text>
            </View>
          </View>

          {/* Lista */}
          {usuarios.length === 0 && (
            <View style={styles.vacio}>
              <Ionicons name="people-outline" size={40} color="#cbd5e1" />
              <Text style={styles.vacioTexto}>Sin usuarios</Text>
            </View>
          )}
          {usuarios.map(renderUsuario)}
        </ScrollView>
      )}

      {/* FAB Invitar */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalInvitar(true)} activeOpacity={0.85}>
        <Ionicons name="person-add" size={22} color="#ffffff" />
      </TouchableOpacity>

      {/* Modal Invitar */}
      <Modal visible={modalInvitar} transparent animationType="fade" onRequestClose={() => setModalInvitar(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Invitar usuario</Text>
            <Text style={styles.modalSub}>Se enviará un correo de invitación</Text>

            <TextInput
              style={styles.input}
              value={emailNuevo}
              onChangeText={setEmailNuevo}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => { setModalInvitar(false); setEmailNuevo(''); }}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnInvitar, enviando && styles.btnDisabled]}
                onPress={invitar}
                disabled={enviando}
              >
                {enviando
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnInvitarTexto}>Invitar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f8fafc' },
  sinAcceso: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  sinAccesoTitulo: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  sinAccesoSub: { fontSize: 14, color: '#64748b', textAlign: 'center' },

  resumen: {
    flexDirection: 'row', backgroundColor: '#ffffff',
    borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    justifyContent: 'space-around',
  },
  resumenItem: { alignItems: 'center', gap: 4 },
  resumenNum: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  resumenLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },

  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: 12,
  },
  itemInactivo: { opacity: 0.55 },

  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center',
  },
  avatarAdmin: { backgroundColor: '#dbeafe' },
  avatarLetra: { fontSize: 18, fontWeight: '700', color: '#1e40af' },

  info: { flex: 1, gap: 3 },
  infoFila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  email: { fontSize: 13, fontWeight: '600', color: '#0f172a', flex: 1 },
  badgeTu: { fontSize: 10, color: '#1e40af', fontWeight: '700', backgroundColor: '#eff6ff', paddingHorizontal: 5, borderRadius: 4 },

  metaFila: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  rolBadge: {
    backgroundColor: '#f1f5f9', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  rolAdmin: { backgroundColor: '#dbeafe' },
  rolTexto: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  rolAdminTexto: { color: '#1e40af' },
  inactivoBadge: { backgroundColor: '#fef2f2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  inactivoTexto: { fontSize: 10, fontWeight: '700', color: '#ef4444' },

  meta: { fontSize: 11, color: '#94a3b8' },

  acciones: { flexDirection: 'row', gap: 4 },
  accionBtn: { padding: 6 },

  vacio: { alignItems: 'center', paddingTop: 60, gap: 8 },
  vacioTexto: { fontSize: 16, fontWeight: '600', color: '#94a3b8' },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1e40af', alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: '#1e40af', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },

  // Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 24,
    width: '100%', maxWidth: 380, gap: 12,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalSub: { fontSize: 13, color: '#64748b', marginTop: -6 },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc',
  },
  modalBotones: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnCancelar: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center',
  },
  btnCancelarTexto: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  btnInvitar: { flex: 1, backgroundColor: '#1e40af', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#93c5fd' },
  btnInvitarTexto: { fontSize: 14, color: '#ffffff', fontWeight: '700' },
});