/**
 * app/(tabs)/admin/columnas.tsx — Gestión de columnas extra (Fase 10.1)
 * CRUD completo: crear, editar, eliminar y reordenar columnas de personas/objetos
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Switch, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { dbColumnas } from '@/lib/db';
import { useAuthStore } from '@/store/useAuthStore';
import type { ColumnaExtra, TablaDB } from '@/types';

// ---------------------------------------------------------------------------
// Tipos locales del modal
// ---------------------------------------------------------------------------
type TipoCampo = 'texto' | 'numero' | 'fecha' | 'checkbox' | 'seleccion';

interface FormState {
  etiqueta: string;
  nombre_campo: string;
  tipo: TipoCampo;
  opciones: string[];
  requerido: boolean;
}

const TIPOS: { valor: TipoCampo; label: string; icono: keyof typeof Ionicons.glyphMap }[] = [
  { valor: 'texto',     label: 'Texto',      icono: 'text' },
  { valor: 'numero',    label: 'Número',     icono: 'calculator' },
  { valor: 'fecha',     label: 'Fecha',      icono: 'calendar' },
  { valor: 'checkbox',  label: 'Checkbox',   icono: 'checkbox' },
  { valor: 'seleccion', label: 'Selección',  icono: 'list' },
];

// Convierte etiqueta a snake_case automáticamente
function toSnakeCase(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // quitar acentos
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

function generarId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function ColumnasScreen() {
  const { esAdmin, usuario } = useAuthStore();
  const [tabActiva, setTabActiva] = useState<TablaDB>('personas');
  const [columnas, setColumnas] = useState<ColumnaExtra[]>([]);
  const [cargando, setCargando] = useState(false);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    etiqueta: '', nombre_campo: '', tipo: 'texto', opciones: ['', ''], requerido: false,
  });

  // Verificar admin
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
  const cargarColumnas = useCallback(() => {
    const lista = dbColumnas.obtenerPorTabla(tabActiva);
    setColumnas(lista);
  }, [tabActiva]);

  useEffect(() => { cargarColumnas(); }, [cargarColumnas]);

  // ---------------------------------------------------------------------------
  // Abrir modal para nueva columna
  const abrirNueva = () => {
    setEditandoId(null);
    setForm({ etiqueta: '', nombre_campo: '', tipo: 'texto', opciones: ['', ''], requerido: false });
    setModalVisible(true);
  };

  // Abrir modal para editar
  const abrirEditar = (col: ColumnaExtra) => {
    setEditandoId(col.id);
    setForm({
      etiqueta: col.etiqueta,
      nombre_campo: col.nombre_campo,
      tipo: col.tipo as TipoCampo,
      opciones: col.opciones?.length ? col.opciones : ['', ''],
      requerido: col.requerido,
    });
    setModalVisible(true);
  };

  // ---------------------------------------------------------------------------
  // Guardar (insertar o actualizar)
  const guardar = async () => {
    if (!form.etiqueta.trim()) {
      Alert.alert('Error', 'La etiqueta es requerida');
      return;
    }
    if (!form.nombre_campo.trim()) {
      Alert.alert('Error', 'El nombre del campo es requerido');
      return;
    }
    if (form.tipo === 'seleccion') {
      const opcionesValidas = form.opciones.filter(o => o.trim());
      if (opcionesValidas.length < 2) {
        Alert.alert('Error', 'La selección requiere al menos 2 opciones');
        return;
      }
    }

    setGuardando(true);
    try {
      const ahora = new Date().toISOString();
      const opciones = form.tipo === 'seleccion'
        ? form.opciones.filter(o => o.trim())
        : [];

      if (editandoId) {
        // Actualizar en Supabase
        const { error } = await supabase.from('columnas_extra').update({
          etiqueta: form.etiqueta.trim(),
          nombre_campo: form.nombre_campo.trim(),
          tipo: form.tipo,
          opciones,
          requerido: form.requerido,
        }).eq('id', editandoId);
        if (error) throw error;

        // Actualizar en SQLite
        const colExistente = columnas.find(c => c.id === editandoId)!;
        dbColumnas.upsertDesdeSync({
          ...colExistente,
          etiqueta: form.etiqueta.trim(),
          nombre_campo: form.nombre_campo.trim(),
          tipo: form.tipo,
          opciones,
          requerido: form.requerido,
        });
      } else {
        // Nuevo: calcular orden
        const maxOrden = columnas.length > 0
          ? Math.max(...columnas.map(c => c.orden)) + 1
          : 0;

        const nueva: ColumnaExtra = {
          id: generarId(),
          tabla: tabActiva,
          nombre_campo: form.nombre_campo.trim(),
          etiqueta: form.etiqueta.trim(),
          tipo: form.tipo,
          opciones,
          requerido: form.requerido,
          activa: true,
          orden: maxOrden,
          creado_en: ahora,
        };

        // Insertar en Supabase
        const { error } = await supabase.from('columnas_extra').insert({
          id: nueva.id,
          tabla: nueva.tabla,
          nombre_campo: nueva.nombre_campo,
          etiqueta: nueva.etiqueta,
          tipo: nueva.tipo,
          opciones: nueva.opciones,
          requerido: nueva.requerido,
          activa: true,
          orden: nueva.orden,
          creado_en: ahora,
        });
        if (error) throw error;

        // Guardar en SQLite
        dbColumnas.upsertDesdeSync(nueva);
      }

      setModalVisible(false);
      cargarColumnas();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Error al guardar', msg);
    } finally {
      setGuardando(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Eliminar (soft-delete: activa=false)
  const eliminar = (col: ColumnaExtra) => {
    Alert.alert(
      'Eliminar columna',
      `¿Eliminar "${col.etiqueta}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive', onPress: async () => {
            setCargando(true);
            try {
              await supabase.from('columnas_extra')
                .update({ activa: false })
                .eq('id', col.id);
              dbColumnas.upsertDesdeSync({ ...col, activa: false });
              cargarColumnas();
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : String(e));
            } finally {
              setCargando(false);
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // Reordenar con ↑↓
  const mover = async (indice: number, direccion: 'arriba' | 'abajo') => {
    const nueva = [...columnas];
    const destino = direccion === 'arriba' ? indice - 1 : indice + 1;
    if (destino < 0 || destino >= nueva.length) return;

    // Intercambiar
    [nueva[indice], nueva[destino]] = [nueva[destino], nueva[indice]];

    // Actualizar órdenes
    const actualizadas = nueva.map((c, i) => ({ ...c, orden: i }));
    setColumnas(actualizadas);

    // Persistir en Supabase y SQLite
    for (const col of actualizadas) {
      dbColumnas.upsertDesdeSync(col);
      await supabase.from('columnas_extra').update({ orden: col.orden }).eq('id', col.id);
    }
  };

  // ---------------------------------------------------------------------------
  // Render del modal
  const renderModal = () => (
    <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalContenedor}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitulo}>
            {editandoId ? 'Editar columna' : 'Nueva columna'}
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {/* Etiqueta */}
          <Text style={styles.label}>Etiqueta *</Text>
          <TextInput
            style={styles.input}
            value={form.etiqueta}
            onChangeText={(t) => setForm(f => ({
              ...f,
              etiqueta: t,
              // Auto-generar nombre_campo solo si no se ha editado manualmente
              nombre_campo: editandoId ? f.nombre_campo : toSnakeCase(t),
            }))}
            placeholder="Ej: Número de credencial"
            placeholderTextColor="#94a3b8"
          />

          {/* nombre_campo */}
          <Text style={styles.label}>Nombre del campo (snake_case)</Text>
          <TextInput
            style={styles.input}
            value={form.nombre_campo}
            onChangeText={(t) => setForm(f => ({ ...f, nombre_campo: t.toLowerCase().replace(/\s/g, '_') }))}
            placeholder="Ej: numero_credencial"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />

          {/* Tipo */}
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.tiposGrid}>
            {TIPOS.map(t => (
              <TouchableOpacity
                key={t.valor}
                style={[styles.tipoBoton, form.tipo === t.valor && styles.tipoActivo]}
                onPress={() => setForm(f => ({ ...f, tipo: t.valor }))}
              >
                <Ionicons name={t.icono} size={18} color={form.tipo === t.valor ? '#ffffff' : '#64748b'} />
                <Text style={[styles.tipoLabel, form.tipo === t.valor && styles.tipoLabelActivo]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Opciones (solo para selección) */}
          {form.tipo === 'seleccion' && (
            <>
              <Text style={styles.label}>Opciones (mínimo 2)</Text>
              {form.opciones.map((op, i) => (
                <View key={i} style={styles.opcionFila}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={op}
                    onChangeText={(t) => {
                      const nuevas = [...form.opciones];
                      nuevas[i] = t;
                      setForm(f => ({ ...f, opciones: nuevas }));
                    }}
                    placeholder={`Opción ${i + 1}`}
                    placeholderTextColor="#94a3b8"
                  />
                  {form.opciones.length > 2 && (
                    <TouchableOpacity
                      style={styles.opcionEliminar}
                      onPress={() => {
                        const nuevas = form.opciones.filter((_, j) => j !== i);
                        setForm(f => ({ ...f, opciones: nuevas }));
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                style={styles.btnAgregarOpcion}
                onPress={() => setForm(f => ({ ...f, opciones: [...f.opciones, ''] }))}
              >
                <Ionicons name="add" size={16} color="#1e40af" />
                <Text style={styles.btnAgregarOpcionTexto}>Agregar opción</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Requerido */}
          <View style={styles.requeridoFila}>
            <Text style={styles.label}>Requerido</Text>
            <Switch
              value={form.requerido}
              onValueChange={(v) => setForm(f => ({ ...f, requerido: v }))}
              trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
              thumbColor={form.requerido ? '#1e40af' : '#94a3b8'}
            />
          </View>
        </ScrollView>

        {/* Botones del modal */}
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)}>
            <Text style={styles.btnCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnGuardar, guardando && styles.btnDisabled]}
            onPress={guardar}
            disabled={guardando}
          >
            {guardando
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnGuardarTexto}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ---------------------------------------------------------------------------
  // Render principal
  return (
    <View style={styles.contenedor}>
      {/* Tabs locales Personas / Objetos */}
      <View style={styles.tabs}>
        {(['personas', 'objetos'] as TablaDB[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, tabActiva === tab && styles.tabActiva]}
            onPress={() => setTabActiva(tab)}
          >
            <Text style={[styles.tabTexto, tabActiva === tab && styles.tabTextoActivo]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de columnas */}
      {cargando ? (
        <ActivityIndicator style={{ marginTop: 32 }} color="#1e40af" />
      ) : (
        <ScrollView style={styles.lista} contentContainerStyle={{ paddingBottom: 100 }}>
          {columnas.length === 0 && (
            <View style={styles.vacio}>
              <Ionicons name="grid-outline" size={40} color="#cbd5e1" />
              <Text style={styles.vacioTexto}>Sin columnas extra</Text>
              <Text style={styles.vacioSub}>Toca "+" para agregar una</Text>
            </View>
          )}

          {columnas.map((col, i) => (
            <View key={col.id} style={styles.item}>
              <View style={styles.itemInfo}>
                {/* Tipo + icono */}
                <View style={styles.itemTipoBadge}>
                  <Ionicons
                    name={TIPOS.find(t => t.valor === col.tipo)?.icono ?? 'text'}
                    size={12}
                    color="#1e40af"
                  />
                  <Text style={styles.itemTipoTexto}>{col.tipo}</Text>
                </View>
                {/* Etiqueta */}
                <Text style={styles.itemEtiqueta}>
                  {col.etiqueta}
                  {col.requerido && <Text style={styles.asterisco}> *</Text>}
                </Text>
                {/* nombre_campo */}
                <Text style={styles.itemCampo}>{col.nombre_campo}</Text>
              </View>

              <View style={styles.itemAcciones}>
                {/* ↑↓ Reordenar */}
                <TouchableOpacity
                  style={[styles.accionBtn, i === 0 && styles.accionDisabled]}
                  onPress={() => mover(i, 'arriba')}
                  disabled={i === 0}
                >
                  <Ionicons name="chevron-up" size={18} color={i === 0 ? '#cbd5e1' : '#64748b'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.accionBtn, i === columnas.length - 1 && styles.accionDisabled]}
                  onPress={() => mover(i, 'abajo')}
                  disabled={i === columnas.length - 1}
                >
                  <Ionicons name="chevron-down" size={18} color={i === columnas.length - 1 ? '#cbd5e1' : '#64748b'} />
                </TouchableOpacity>
                {/* Editar */}
                <TouchableOpacity style={styles.accionBtn} onPress={() => abrirEditar(col)}>
                  <Ionicons name="pencil" size={16} color="#1e40af" />
                </TouchableOpacity>
                {/* Eliminar */}
                <TouchableOpacity style={styles.accionBtn} onPress={() => eliminar(col)}>
                  <Ionicons name="trash" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* FAB + */}
      <TouchableOpacity style={styles.fab} onPress={abrirNueva} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {renderModal()}
    </View>
  );
}

// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f8fafc' },
  sinAcceso: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  sinAccesoTitulo: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  sinAccesoSub: { fontSize: 14, color: '#64748b', textAlign: 'center' },

  tabs: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActiva: { borderBottomWidth: 2, borderBottomColor: '#1e40af' },
  tabTexto: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  tabTextoActivo: { color: '#1e40af' },

  lista: { flex: 1 },
  vacio: { alignItems: 'center', paddingTop: 60, gap: 8 },
  vacioTexto: { fontSize: 16, fontWeight: '600', color: '#94a3b8' },
  vacioSub: { fontSize: 13, color: '#cbd5e1' },

  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffffff', marginHorizontal: 12, marginTop: 10,
    borderRadius: 12, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  itemInfo: { flex: 1, gap: 3 },
  itemTipoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#eff6ff', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  itemTipoTexto: { fontSize: 10, color: '#1e40af', fontWeight: '600' },
  itemEtiqueta: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  asterisco: { color: '#ef4444' },
  itemCampo: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },

  itemAcciones: { flexDirection: 'row', gap: 2 },
  accionBtn: { padding: 6 },
  accionDisabled: { opacity: 0.3 },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1e40af', alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: '#1e40af', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },

  // Modal
  modalContenedor: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalBody: { flex: 1, padding: 20 },

  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#0f172a', backgroundColor: '#ffffff', marginBottom: 4,
  },

  tiposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipoBoton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff',
  },
  tipoActivo: { backgroundColor: '#1e40af', borderColor: '#1e40af' },
  tipoLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  tipoLabelActivo: { color: '#ffffff' },

  opcionFila: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  opcionEliminar: { padding: 4 },
  btnAgregarOpcion: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, marginTop: 4,
  },
  btnAgregarOpcionTexto: { fontSize: 13, color: '#1e40af', fontWeight: '600' },

  requeridoFila: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 16,
  },

  modalFooter: {
    flexDirection: 'row', gap: 12, padding: 20,
    backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  btnCancelar: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center',
  },
  btnCancelarTexto: { fontSize: 15, color: '#64748b', fontWeight: '600' },
  btnGuardar: { flex: 1, backgroundColor: '#1e40af', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#93c5fd' },
  btnGuardarTexto: { fontSize: 15, color: '#ffffff', fontWeight: '700' },
});