import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { dbPersonas, dbObjetos, dbColumnas, dbMeta } from '@/lib/db';

// =============================================================================
// PANTALLA TEMPORAL DE PRUEBA DE SQLITE
// Se reemplaza en Fase 5 con la UI real
// =============================================================================

interface ResultadoPrueba {
  nombre: string;
  ok: boolean;
  detalle: string;
}

const UID_TEST = 'user-test-123';

function ejecutarPruebas(): ResultadoPrueba[] {
  const resultados: ResultadoPrueba[] = [];

  const registrar = (nombre: string, fn: () => string) => {
    try {
      const detalle = fn();
      resultados.push({ nombre, ok: true, detalle });
    } catch (e) {
      resultados.push({ nombre, ok: false, detalle: String(e) });
    }
  };

  const ahora = new Date().toISOString();
  const ID = `test-${Date.now()}`;

  // --- INSERT persona ---
  registrar('insertar persona', () => {
    dbPersonas.insertar({
      id: ID,
      nombre: 'Juan Prueba',
      numero_elemento: 'EL-001',
      fecha_registro: '2025-01-15',
      datos_extra: { edad: 30, ciudad: 'CDMX' },
      creado_por: UID_TEST,
      creado_en: ahora,
      actualizado_en: ahora,
      eliminado: false,
    });
    return `ID: ${ID}`;
  });

  // --- GET por ID ---
  registrar('obtener por ID', () => {
    const p = dbPersonas.obtenerPorId(ID);
    if (!p) throw new Error('No encontrado');
    return `nombre: ${p.nombre}, datos_extra: ${JSON.stringify(p.datos_extra)}`;
  });

  // --- OBTENER TODAS ---
  registrar('obtener todas (filtro vacio)', () => {
    const lista = dbPersonas.obtenerTodas({ busqueda: '', mostrarEliminados: false });
    return `${lista.length} registros`;
  });

  // --- FILTRO BUSQUEDA ---
  registrar('filtrar por nombre', () => {
    const lista = dbPersonas.obtenerTodas({ busqueda: 'Juan', mostrarEliminados: false });
    const encontrado = lista.some(p => p.id === ID);
    return `encontrado: ${encontrado}, total: ${lista.length}`;
  });

  // --- UPDATE ---
  registrar('actualizar persona', () => {
    dbPersonas.actualizar(ID, { nombre: 'Juan Actualizado', datos_extra: { edad: 31 } });
    const p = dbPersonas.obtenerPorId(ID);
    return `nombre: ${p?.nombre}, edad: ${(p?.datos_extra as { edad: number })?.edad}`;
  });

  // --- PENDIENTES ---
  registrar('obtener pendientes (sincronizado=0)', () => {
    const pend = dbPersonas.obtenerPendientes();
    return `${pend.length} pendientes`;
  });

  // --- SYNC META ---
  registrar('sync meta get/set', () => {
    const antes = dbMeta.getUltimaSync('personas');
    dbMeta.setUltimaSync('personas', ahora);
    const despues = dbMeta.getUltimaSync('personas');
    return `antes: ${antes.substring(0, 10)}, despues: ${despues.substring(0, 10)}`;
  });

  // --- OBJETO insert ---
  const ID_OBJ = `obj-${Date.now()}`;
  registrar('insertar objeto', () => {
    dbObjetos.insertar({
      id: ID_OBJ,
      nombre: 'Objeto Prueba',
      tipo: 'herramienta',
      descripcion: 'Desc test',
      datos_extra: {},
      creado_por: UID_TEST,
      creado_en: ahora,
      actualizado_en: ahora,
      eliminado: false,
    });
    const o = dbObjetos.obtenerPorId(ID_OBJ);
    return `nombre: ${o?.nombre}, tipo: ${o?.tipo}`;
  });

  // --- COLUMNA upsert + obtener ---
  registrar('columna extra upsert + obtener', () => {
    const COL_ID = `col-${Date.now()}`;
    dbColumnas.upsertDesdeSync({
      id: COL_ID,
      tabla: 'personas',
      nombre_campo: 'telefono',
      etiqueta: 'Teléfono',
      tipo: 'texto',
      opciones: [],
      requerido: false,
      activa: true,
      orden: 1,
      creado_en: ahora,
    });
    const cols = dbColumnas.obtenerPorTabla('personas');
    const encontrada = cols.some(c => c.id === COL_ID);
    return `columnas activas: ${cols.length}, encontrada: ${encontrada}`;
  });

  // --- MARCAR ELIMINADA ---
  registrar('marcar eliminada persona', () => {
    dbPersonas.marcarEliminada(ID);
    const p = dbPersonas.obtenerPorId(ID);
    return `eliminado: ${p?.eliminado}, pendiente_eliminar: ${p?.pendiente_eliminar}`;
  });

  return resultados;
}

// =============================================================================
export default function PersonasScreen() {
  const [resultados, setResultados] = useState<ResultadoPrueba[]>([]);
  const [ejecutado, setEjecutado] = useState(false);

  const correrPruebas = () => {
    const res = ejecutarPruebas();
    setResultados(res);
    setEjecutado(true);
  };

  useEffect(() => {
    correrPruebas();
  }, []);

  const total = resultados.length;
  const ok = resultados.filter(r => r.ok).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>🧪 Prueba SQLite — Fase 4</Text>

      <View style={[styles.resumen, ok === total && total > 0 ? styles.resumenOk : styles.resumenError]}>
        <Text style={styles.resumenTexto}>
          {ok}/{total} pruebas pasadas {ok === total && total > 0 ? '✅' : '❌'}
        </Text>
      </View>

      {resultados.map((r, i) => (
        <View key={i} style={[styles.item, r.ok ? styles.itemOk : styles.itemError]}>
          <Text style={styles.itemTitulo}>
            {r.ok ? '✅' : '❌'} {r.nombre}
          </Text>
          <Text style={styles.itemDetalle}>{r.detalle}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.boton} onPress={correrPruebas}>
        <Text style={styles.botonTexto}>Volver a ejecutar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  titulo: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12, textAlign: 'center' },
  resumen: { padding: 12, borderRadius: 10, marginBottom: 16, alignItems: 'center' },
  resumenOk: { backgroundColor: '#dcfce7' },
  resumenError: { backgroundColor: '#fee2e2' },
  resumenTexto: { fontSize: 16, fontWeight: '700' },
  item: { padding: 12, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4 },
  itemOk: { backgroundColor: '#f0fdf4', borderLeftColor: '#22c55e' },
  itemError: { backgroundColor: '#fef2f2', borderLeftColor: '#ef4444' },
  itemTitulo: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  itemDetalle: { fontSize: 11, color: '#64748b', fontFamily: 'monospace' },
  boton: { backgroundColor: '#1e40af', padding: 14, borderRadius: 10, marginTop: 16, alignItems: 'center' },
  botonTexto: { color: '#fff', fontWeight: '700' },
});