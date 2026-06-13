import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  Alert, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePersonasStore } from '@/store/usePersonasStore';
import { useAuthStore } from '@/store/useAuthStore';
import FormularioDinamico from '@/components/FormularioDinamico';
import FotoPicker from '@/components/FotoPicker';

export default function NuevaPersonaScreen() {
  const router = useRouter();
  const { crearPersona } = usePersonasStore();
  const { usuario } = useAuthStore();

  const [nombre, setNombre] = useState('');
  const [numeroElemento, setNumeroElemento] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState('');
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
      await crearPersona(
        {
          nombre: nombre.trim(),
          numero_elemento: numeroElemento.trim() || undefined,
          fecha_registro: fechaRegistro || undefined,
          foto_local: fotoLocal,
          datos_extra: datosExtra,
        },
        usuario.id
      );
      Alert.alert('✅ Guardado', 'Persona creada correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la persona.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Foto */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Foto</Text>
          <FotoPicker uri={fotoLocal} onSelect={setFotoLocal} disabled={cargando} />
        </View>

        {/* Campos fijos */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Información básica</Text>

          <Text style={styles.label}>Nombre <Text style={styles.asterisco}>*</Text></Text>
          <TextInput
            style={[styles.input, cargando && styles.inputDisabled]}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre completo"
            placeholderTextColor="#94a3b8"
            editable={!cargando}
          />

          <Text style={styles.label}>Número de elemento</Text>
          <TextInput
            style={[styles.input, cargando && styles.inputDisabled]}
            value={numeroElemento}
            onChangeText={setNumeroElemento}
            placeholder="EJ-001"
            placeholderTextColor="#94a3b8"
            editable={!cargando}
          />

          <Text style={styles.label}>Fecha de registro</Text>
          <TextInput
            style={[styles.input, cargando && styles.inputDisabled]}
            value={fechaRegistro}
            onChangeText={setFechaRegistro}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            editable={!cargando}
          />
        </View>

        {/* Campos dinámicos */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Campos adicionales</Text>
          <FormularioDinamico
            tabla="personas"
            onSubmit={handleGuardar}
            cargando={cargando}
            esEdicion={false}
          />
        </View>

        {/* Si no hay columnas extra, mostrar botón aquí */}
        <TouchableOpacity
          style={[styles.boton, (!nombre.trim() || cargando) && styles.botonDisabled]}
          onPress={() => handleGuardar({})}
          disabled={!nombre.trim() || cargando}
          activeOpacity={0.8}
        >
          {cargando
            ? <ActivityIndicator color="#ffffff" size="small" />
            : <Text style={styles.botonTexto}>Guardar persona</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  seccion: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 16,
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
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
  inputDisabled: { opacity: 0.6 },
  boton: {
    backgroundColor: '#1e40af', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
    shadowColor: '#1e40af', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  botonDisabled: { backgroundColor: '#93c5fd', elevation: 0 },
  botonTexto: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});