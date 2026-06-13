import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, StyleSheet,
  ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useObjetosStore } from '@/store/useObjetosStore';
import { useAuthStore } from '@/store/useAuthStore';
import FormularioDinamico from '@/components/FormularioDinamico';
import FotoPicker from '@/components/FotoPicker';
import type { Objeto } from '@/types';

export default function DetalleObjetoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { obtenerPorId, actualizarObjeto, eliminarObjeto } = useObjetosStore();
  const { esAdmin } = useAuthStore();

  const [objeto, setObjeto] = useState<Objeto | null>(null);
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoLocal, setFotoLocal] = useState<string | undefined>();

  useEffect(() => {
    if (id) {
      const o = obtenerPorId(id);
      if (o) {
        setObjeto(o);
        setNombre(o.nombre);
        setTipo(o.tipo ?? '');
        setDescripcion(o.descripcion ?? '');
        setFotoLocal(o.foto_local);
      }
    }
  }, [id]);

  const handleGuardar = async (datosExtra: Record<string, unknown>) => {
    if (!nombre.trim() || !id) return;
    setCargando(true);
    try {
      await actualizarObjeto(id, {
        nombre: nombre.trim(),
        tipo: tipo.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
        foto_local: fotoLocal,
        datos_extra: datosExtra,
      });
      const actualizado = obtenerPorId(id);
      setObjeto(actualizado);
      setEditando(false);
      Alert.alert('✅ Actualizado', 'Los cambios se guardaron localmente.');
    } catch {
      Alert.alert('Error', 'No se pudo actualizar.');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = () => {
    Alert.alert(
      '⚠️ Eliminar objeto',
      `¿Seguro que deseas eliminar "${objeto?.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              await eliminarObjeto(id);
              router.back();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };

  if (!objeto) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  const fotoUri = fotoLocal ?? objeto.foto_url;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Encabezado */}
        <View style={styles.encabezado}>
          {fotoUri
            ? <Image source={{ uri: fotoUri }} style={styles.foto} />
            : (
              <View style={styles.fotoPlaceholder}>
                <Ionicons name="cube" size={40} color="#ffffff" />
              </View>
            )
          }
          <Text style={styles.nombreHeader}>{objeto.nombre}</Text>
          {objeto.tipo && <Text style={styles.tipoHeader}>{objeto.tipo}</Text>}
          {objeto.eliminado && (
            <View style={styles.badgeEliminado}>
              <Text style={styles.badgeTexto}>ELIMINADO</Text>
            </View>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.acciones}>
          <TouchableOpacity
            style={[styles.btnAccion, editando && styles.btnActivo]}
            onPress={() => setEditando(!editando)}
            disabled={cargando || objeto.eliminado}
          >
            <Ionicons name={editando ? 'close' : 'create'} size={16} color={editando ? '#fff' : '#1e40af'} />
            <Text style={[styles.btnAccionTexto, editando && styles.btnActivoTexto]}>
              {editando ? 'Cancelar' : 'Editar'}
            </Text>
          </TouchableOpacity>

          {esAdmin && !objeto.eliminado && (
            <TouchableOpacity style={styles.btnEliminar} onPress={handleEliminar} disabled={cargando}>
              <Ionicons name="trash" size={16} color="#dc2626" />
              <Text style={styles.btnEliminarTexto}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Vista */}
        {!editando && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Información</Text>
            <Campo etiqueta="Nombre" valor={objeto.nombre} />
            <Campo etiqueta="Tipo" valor={objeto.tipo} />
            <Campo etiqueta="Descripción" valor={objeto.descripcion} />
            <Campo etiqueta="Creado el" valor={objeto.creado_en.substring(0, 10)} />
            {Object.keys(objeto.datos_extra).length > 0 && (
              <>
                <Text style={[styles.seccionTitulo, { marginTop: 12 }]}>Campos adicionales</Text>
                {Object.entries(objeto.datos_extra).map(([k, v]) => (
                  <Campo key={k} etiqueta={k} valor={String(v ?? '—')} />
                ))}
              </>
            )}
          </View>
        )}

        {/* Edición */}
        {editando && (
          <>
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Foto</Text>
              <FotoPicker uri={fotoLocal} onSelect={setFotoLocal} disabled={cargando} />
            </View>
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Información básica</Text>
              <Text style={styles.label}>Nombre <Text style={styles.asterisco}>*</Text></Text>
              <TextInput style={styles.input} value={nombre} onChangeText={setNombre} editable={!cargando} />
              <Text style={styles.label}>Tipo</Text>
              <TextInput style={styles.input} value={tipo} onChangeText={setTipo} editable={!cargando} />
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, { height: 80, paddingTop: 10 }]}
                value={descripcion} onChangeText={setDescripcion}
                multiline textAlignVertical="top" editable={!cargando}
              />
            </View>
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Campos adicionales</Text>
              <FormularioDinamico
                tabla="objetos"
                valoresIniciales={objeto.datos_extra as Record<string, unknown>}
                onSubmit={handleGuardar}
                cargando={cargando}
                esEdicion
              />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.campoValor}>{valor || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  encabezado: { backgroundColor: '#1e40af', alignItems: 'center', paddingVertical: 28 },
  foto: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff', marginBottom: 12 },
  fotoPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: '#fff',
  },
  nombreHeader: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  tipoHeader: { color: '#bfdbfe', fontSize: 13 },
  badgeEliminado: { backgroundColor: '#dc2626', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 },
  badgeTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  acciones: {
    flexDirection: 'row', gap: 12, padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  btnAccion: {
    flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#1e40af',
  },
  btnActivo: { backgroundColor: '#1e40af' },
  btnAccionTexto: { color: '#1e40af', fontWeight: '600', fontSize: 14 },
  btnActivoTexto: { color: '#fff' },
  btnEliminar: {
    flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#fecaca', backgroundColor: '#fef2f2',
  },
  btnEliminarTexto: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
  seccion: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, margin: 16, marginBottom: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  seccionTitulo: { fontSize: 13, fontWeight: '700', color: '#1e40af', marginBottom: 12 },
  campo: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 },
  campoEtiqueta: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginBottom: 2 },
  campoValor: { fontSize: 14, color: '#0f172a' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  asterisco: { color: '#dc2626' },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 12,
  },
});