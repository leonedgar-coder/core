import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, StyleSheet,
  ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePersonasStore } from '@/store/usePersonasStore';
import { useAuthStore } from '@/store/useAuthStore';
import FormularioDinamico from '@/components/FormularioDinamico';
import FotoPicker from '@/components/FotoPicker';
import type { Persona } from '@/types';

export default function DetallePersonaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { obtenerPorId, actualizarPersona, eliminarPersona } = usePersonasStore();
  const { esAdmin } = useAuthStore();

  const [persona, setPersona] = useState<Persona | null>(null);
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Campos editables
  const [nombre, setNombre] = useState('');
  const [numeroElemento, setNumeroElemento] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState('');
  const [fotoLocal, setFotoLocal] = useState<string | undefined>();

  useEffect(() => {
    if (id) {
      const p = obtenerPorId(id);
      if (p) {
        setPersona(p);
        setNombre(p.nombre);
        setNumeroElemento(p.numero_elemento ?? '');
        setFechaRegistro(p.fecha_registro ?? '');
        setFotoLocal(p.foto_local);
      }
    }
  }, [id]);

  const handleGuardar = async (datosExtra: Record<string, unknown>) => {
    if (!nombre.trim() || !id) return;
    setCargando(true);
    try {
      await actualizarPersona(id, {
        nombre: nombre.trim(),
        numero_elemento: numeroElemento.trim() || undefined,
        fecha_registro: fechaRegistro || undefined,
        foto_local: fotoLocal,
        datos_extra: datosExtra,
      });
      const actualizada = obtenerPorId(id);
      setPersona(actualizada);
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
      '⚠️ Eliminar persona',
      `¿Seguro que deseas eliminar a "${persona?.nombre}"? Esta acción se sincronizará con el servidor.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              await eliminarPersona(id);
              router.back();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };

  if (!persona) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  const fotoUri = fotoLocal ?? persona.foto_url;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Encabezado con foto */}
        <View style={styles.encabezado}>
          {fotoUri
            ? <Image source={{ uri: fotoUri }} style={styles.foto} />
            : (
              <View style={styles.fotoPlaceholder}>
                <Text style={styles.fotoInicial}>{persona.nombre.charAt(0).toUpperCase()}</Text>
              </View>
            )
          }
          <Text style={styles.nombreHeader}>{persona.nombre}</Text>
          {persona.numero_elemento && (
            <Text style={styles.elementoHeader}>#{persona.numero_elemento}</Text>
          )}
          {persona.eliminado && (
            <View style={styles.badgeEliminado}>
              <Text style={styles.badgeEliminadoTexto}>ELIMINADO</Text>
            </View>
          )}
        </View>

        {/* Botones de acción */}
        <View style={styles.acciones}>
          <TouchableOpacity
            style={[styles.btnAccion, editando && styles.btnAccionActivo]}
            onPress={() => setEditando(!editando)}
            disabled={cargando || persona.eliminado}
          >
            <Ionicons name={editando ? 'close' : 'create'} size={16} color={editando ? '#ffffff' : '#1e40af'} />
            <Text style={[styles.btnAccionTexto, editando && styles.btnAccionTextoActivo]}>
              {editando ? 'Cancelar' : 'Editar'}
            </Text>
          </TouchableOpacity>

          {esAdmin && !persona.eliminado && (
            <TouchableOpacity style={styles.btnEliminar} onPress={handleEliminar} disabled={cargando}>
              <Ionicons name="trash" size={16} color="#dc2626" />
              <Text style={styles.btnEliminarTexto}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Modo vista */}
        {!editando && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Información básica</Text>
            <CampoVista etiqueta="Nombre" valor={persona.nombre} />
            <CampoVista etiqueta="Número de elemento" valor={persona.numero_elemento} />
            <CampoVista etiqueta="Fecha de registro" valor={persona.fecha_registro} />
            <CampoVista etiqueta="Creado el" valor={persona.creado_en.substring(0, 10)} />

            {/* Datos extra */}
            {Object.keys(persona.datos_extra).length > 0 && (
              <>
                <Text style={[styles.seccionTitulo, { marginTop: 12 }]}>Campos adicionales</Text>
                {Object.entries(persona.datos_extra).map(([k, v]) => (
                  <CampoVista key={k} etiqueta={k} valor={String(v ?? '—')} />
                ))}
              </>
            )}
          </View>
        )}

        {/* Modo edición */}
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

              <Text style={styles.label}>Número de elemento</Text>
              <TextInput style={styles.input} value={numeroElemento} onChangeText={setNumeroElemento} editable={!cargando} />

              <Text style={styles.label}>Fecha de registro</Text>
              <TextInput style={styles.input} value={fechaRegistro} onChangeText={setFechaRegistro} placeholder="YYYY-MM-DD" editable={!cargando} />
            </View>

            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Campos adicionales</Text>
              <FormularioDinamico
                tabla="personas"
                valoresIniciales={persona.datos_extra as Record<string, unknown>}
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

function CampoVista({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  return (
    <View style={styles.campoVista}>
      <Text style={styles.campoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.campoValor}>{valor || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  encabezado: { backgroundColor: '#1e40af', alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 },
  foto: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#ffffff', marginBottom: 12 },
  fotoPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#3b82f6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: '#ffffff',
  },
  fotoInicial: { color: '#ffffff', fontSize: 40, fontWeight: '700' },
  nombreHeader: { color: '#ffffff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  elementoHeader: { color: '#bfdbfe', fontSize: 14 },
  badgeEliminado: { backgroundColor: '#dc2626', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 },
  badgeEliminadoTexto: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  acciones: {
    flexDirection: 'row', gap: 12, padding: 16,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  btnAccion: {
    flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#1e40af',
  },
  btnAccionActivo: { backgroundColor: '#1e40af' },
  btnAccionTexto: { color: '#1e40af', fontWeight: '600', fontSize: 14 },
  btnAccionTextoActivo: { color: '#ffffff' },
  btnEliminar: {
    flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  btnEliminarTexto: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
  seccion: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 16,
    margin: 16, marginBottom: 0, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  seccionTitulo: { fontSize: 13, fontWeight: '700', color: '#1e40af', marginBottom: 12 },
  campoVista: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 },
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