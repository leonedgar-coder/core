import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useObjetosStore } from '@/store/useObjetosStore';
import { useAuthStore } from '@/store/useAuthStore';
import FormularioDinamico from '@/components/FormularioDinamico';
import FotoPicker from '@/components/FotoPicker';

export default function NuevoObjetoScreen() {
  const router = useRouter();
  const { crearObjeto } = useObjetosStore();
  const { usuario } = useAuthStore();

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoLocal, setFotoLocal] = useState<string | undefined>();
  const [cargando, setCargando] = useState(false);

  const handleGuardar = async (datosExtra: Record<string, unknown>) => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre es obligatorio.');
      return;
    }
    if (!usuario) return;

    setCargando(true);
    try {
      await crearObjeto(
        {
          nombre: nombre.trim(),
          tipo: tipo.trim() || undefined,
          descripcion: descripcion.trim() || undefined,
          foto_local: fotoLocal,
          datos_extra: datosExtra,
        },
        usuario.id
      );
      Alert.alert('✅ Guardado', 'Objeto creado correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el objeto.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Foto</Text>
          <FotoPicker uri={fotoLocal} onSelect={setFotoLocal} disabled={cargando} />
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Información básica</Text>

          <Text style={styles.label}>Nombre <Text style={styles.asterisco}>*</Text></Text>
          <TextInput
            style={[styles.input, cargando && styles.disabled]}
            value={nombre} onChangeText={setNombre}
            placeholder="Nombre del objeto" placeholderTextColor="#94a3b8"
            editable={!cargando}
          />

          <Text style={styles.label}>Tipo</Text>
          <TextInput
            style={[styles.input, cargando && styles.disabled]}
            value={tipo} onChangeText={setTipo}
            placeholder="Ej: Herramienta, Equipo…" placeholderTextColor="#94a3b8"
            editable={!cargando}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.multiline, cargando && styles.disabled]}
            value={descripcion} onChangeText={setDescripcion}
            placeholder="Descripción del objeto…" placeholderTextColor="#94a3b8"
            multiline numberOfLines={4} textAlignVertical="top"
            editable={!cargando}
          />
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Campos adicionales</Text>
          <FormularioDinamico
            tabla="objetos"
            onSubmit={handleGuardar}
            cargando={cargando}
            esEdicion={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.boton, (!nombre.trim() || cargando) && styles.botonDisabled]}
          onPress={() => handleGuardar({})}
          disabled={!nombre.trim() || cargando}
          activeOpacity={0.8}
        >
          {cargando
            ? <ActivityIndicator color="#ffffff" size="small" />
            : <Text style={styles.botonTexto}>Guardar objeto</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  seccion: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  seccionTitulo: { fontSize: 14, fontWeight: '700', color: '#1e40af', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  asterisco: { color: '#dc2626' },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 12,
  },
  multiline: { height: 100, paddingTop: 11 },
  disabled: { opacity: 0.6 },
  boton: {
    backgroundColor: '#1e40af', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
    shadowColor: '#1e40af', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  botonDisabled: { backgroundColor: '#93c5fd', elevation: 0 },
  botonTexto: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});