import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { dbColumnas } from '@/lib/db';
import type { ColumnaExtra, TablaDB } from '@/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface FormularioDinamicoProps {
  tabla: TablaDB;
  valoresIniciales?: Record<string, unknown>;
  onSubmit: (valores: Record<string, unknown>) => Promise<void> | void;
  cargando?: boolean;
  esEdicion?: boolean;
}

// ---------------------------------------------------------------------------
// Componente picker de fecha sin dependencias externas
// (tres Pickers nativos: día/mes/año)
// ---------------------------------------------------------------------------
function PickerFecha({
  valor,
  onChange,
  disabled,
}: {
  valor: string;
  onChange: (fecha: string) => void;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const hoy = new Date();
  const [dia, setDia] = useState(hoy.getDate());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());

  useEffect(() => {
    if (valor) {
      const [a, m, d] = valor.split('-').map(Number);
      if (a) setAnio(a);
      if (m) setMes(m);
      if (d) setDia(d);
    }
  }, [valor]);

  const confirmar = () => {
    const d = String(dia).padStart(2, '0');
    const m = String(mes).padStart(2, '0');
    onChange(`${anio}-${m}-${d}`);
    setVisible(false);
  };

  const dias = Array.from({ length: 31 }, (_, i) => i + 1);
  const meses = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
  ];
  const anios = Array.from({ length: 80 }, (_, i) => hoy.getFullYear() - i);

  return (
    <>
      <TouchableOpacity
        style={[styles.inputFecha, disabled && styles.inputDisabled]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={valor ? styles.fechaTexto : styles.fechaPlaceholder}>
          {valor ? valor.split('-').reverse().join('/') : 'Seleccionar fecha…'}
        </Text>
        <Text>📅</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>Seleccionar fecha</Text>
            <View style={styles.pickersRow}>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Día</Text>
                <Picker selectedValue={dia} onValueChange={setDia} style={styles.pickerSmall}>
                  {dias.map((d) => <Picker.Item key={d} label={String(d)} value={d} />)}
                </Picker>
              </View>
              <View style={[styles.pickerCol, { flex: 2 }]}>
                <Text style={styles.pickerLabel}>Mes</Text>
                <Picker selectedValue={mes} onValueChange={setMes} style={styles.pickerSmall}>
                  {meses.map((m, i) => <Picker.Item key={i} label={m} value={i + 1} />)}
                </Picker>
              </View>
              <View style={styles.pickerCol}>
                <Text style={styles.pickerLabel}>Año</Text>
                <Picker selectedValue={anio} onValueChange={setAnio} style={styles.pickerSmall}>
                  {anios.map((a) => <Picker.Item key={a} label={String(a)} value={a} />)}
                </Picker>
              </View>
            </View>
            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setVisible(false)}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmar} onPress={confirmar}>
                <Text style={styles.btnConfirmarTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function FormularioDinamico({
  tabla,
  valoresIniciales = {},
  onSubmit,
  cargando = false,
  esEdicion = false,
}: FormularioDinamicoProps) {
  const [columnas, setColumnas] = useState<ColumnaExtra[]>([]);
  const [valores, setValores] = useState<Record<string, unknown>>(valoresIniciales);
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    const cols = dbColumnas.obtenerPorTabla(tabla);
    setColumnas(cols);
    // Inicializar valores por defecto para columnas sin valor
    const defaults: Record<string, unknown> = {};
    cols.forEach((c) => {
      if (valores[c.nombre_campo] === undefined) {
        if (c.tipo === 'checkbox') defaults[c.nombre_campo] = false;
        else defaults[c.nombre_campo] = '';
      }
    });
    setValores((v) => ({ ...defaults, ...v }));
  }, [tabla]);

  const setValor = (campo: string, valor: unknown) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: '' }));
  };

  const validar = (): boolean => {
    const nuevosErrores: Record<string, string> = {};
    columnas.forEach((c) => {
      if (c.requerido) {
        const v = valores[c.nombre_campo];
        if (v === undefined || v === null || v === '') {
          nuevosErrores[c.nombre_campo] = `${c.etiqueta} es obligatorio`;
        }
      }
    });
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async () => {
    if (!validar()) return;

    // Parsear números
    const valoresparsed: Record<string, unknown> = { ...valores };
    columnas.forEach((c) => {
      if (c.tipo === 'numero' && valoresparsed[c.nombre_campo] !== '') {
        valoresparsed[c.nombre_campo] = Number(valoresparsed[c.nombre_campo]);
      }
    });

    await onSubmit(valoresparsed);
  };

  const renderCampo = (col: ColumnaExtra) => {
    const valor = valores[col.nombre_campo];
    const errorMsg = errores[col.nombre_campo];

    return (
      <View key={col.nombre_campo} style={styles.campo}>
        <Text style={styles.label}>
          {col.etiqueta}
          {col.requerido && <Text style={styles.asterisco}> *</Text>}
        </Text>

        {/* TEXTO */}
        {col.tipo === 'texto' && (
          <TextInput
            style={[styles.input, !!errorMsg && styles.inputError, cargando && styles.inputDisabled]}
            value={String(valor ?? '')}
            onChangeText={(t) => setValor(col.nombre_campo, t)}
            editable={!cargando}
            placeholder={col.etiqueta}
            placeholderTextColor="#94a3b8"
          />
        )}

        {/* NUMERO */}
        {col.tipo === 'numero' && (
          <TextInput
            style={[styles.input, !!errorMsg && styles.inputError, cargando && styles.inputDisabled]}
            value={String(valor ?? '')}
            onChangeText={(t) => setValor(col.nombre_campo, t)}
            keyboardType="numeric"
            editable={!cargando}
            placeholder="0"
            placeholderTextColor="#94a3b8"
          />
        )}

        {/* FECHA */}
        {col.tipo === 'fecha' && (
          <PickerFecha
            valor={String(valor ?? '')}
            onChange={(f) => setValor(col.nombre_campo, f)}
            disabled={cargando}
          />
        )}

        {/* CHECKBOX */}
        {col.tipo === 'checkbox' && (
          <View style={styles.switchRow}>
            <Switch
              value={!!valor}
              onValueChange={(v) => setValor(col.nombre_campo, v)}
              disabled={cargando}
              trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
              thumbColor={valor ? '#1e40af' : '#94a3b8'}
            />
            <Text style={styles.switchLabel}>{valor ? 'Sí' : 'No'}</Text>
          </View>
        )}

        {/* SELECCION */}
        {col.tipo === 'seleccion' && (
          <View style={[styles.pickerWrapper, !!errorMsg && styles.inputError]}>
            <Picker
              selectedValue={String(valor ?? '')}
              onValueChange={(v) => setValor(col.nombre_campo, v)}
              enabled={!cargando}
              style={styles.picker}
            >
              <Picker.Item label="-- Seleccionar --" value="" />
              {(col.opciones ?? []).map((op) => (
                <Picker.Item key={op} label={op} value={op} />
              ))}
            </Picker>
          </View>
        )}

        {/* Error inline */}
        {!!errorMsg && <Text style={styles.errorTexto}>{errorMsg}</Text>}
      </View>
    );
  };

  if (columnas.length === 0) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
        {columnas.map(renderCampo)}

        <TouchableOpacity
          style={[styles.botonGuardar, cargando && styles.botonDisabled]}
          onPress={handleSubmit}
          disabled={cargando}
          activeOpacity={0.8}
        >
          {cargando
            ? <ActivityIndicator color="#ffffff" size="small" />
            : <Text style={styles.botonTexto}>{esEdicion ? 'Actualizar' : 'Guardar'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  flex: { flex: 1 },
  campo: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  asterisco: { color: '#dc2626' },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    color: '#0f172a', backgroundColor: '#f8fafc',
  },
  inputError: { borderColor: '#ef4444' },
  inputDisabled: { opacity: 0.6 },
  errorTexto: { color: '#dc2626', fontSize: 11, marginTop: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchLabel: { fontSize: 14, color: '#374151' },
  pickerWrapper: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    backgroundColor: '#f8fafc', overflow: 'hidden',
  },
  picker: { height: 48 },
  inputFecha: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#f8fafc',
  },
  fechaTexto: { fontSize: 14, color: '#0f172a' },
  fechaPlaceholder: { fontSize: 14, color: '#94a3b8' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContenido: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  modalTitulo: { fontSize: 16, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 12 },
  pickersRow: { flexDirection: 'row', gap: 8 },
  pickerCol: { flex: 1 },
  pickerLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', textAlign: 'center', marginBottom: 4 },
  pickerSmall: { height: 160 },
  modalBotones: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btnCancelar: {
    flex: 1, padding: 14, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#e2e8f0', alignItems: 'center',
  },
  btnCancelarTexto: { fontWeight: '600', color: '#374151' },
  btnConfirmar: {
    flex: 1, padding: 14, borderRadius: 10,
    backgroundColor: '#1e40af', alignItems: 'center',
  },
  btnConfirmarTexto: { fontWeight: '700', color: '#ffffff' },
  botonGuardar: {
    backgroundColor: '#1e40af', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 8, marginBottom: 24,
    shadowColor: '#1e40af', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  botonDisabled: { backgroundColor: '#93c5fd', elevation: 0 },
  botonTexto: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});