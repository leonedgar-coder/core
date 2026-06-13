import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePersonasStore } from '@/store/usePersonasStore';
import { useSyncStore } from '@/store/useSyncStore';
import { useAuthStore } from '@/store/useAuthStore';
import { dbColumnas } from '@/lib/db';
import TablaVista from '@/components/TablaVista';
import type { ColumnaExtra, OrdenColumna } from '@/types';

const DEBOUNCE_MS = 300;

export default function PersonasListaScreen() {
  const router = useRouter();
  const { esAdmin } = useAuthStore();
  const {
    personas, cargando, filtro,
    cargarPersonas, setBusqueda, setOrden, toggleMostrarEliminados,
  } = usePersonasStore();
  const { contarPendientes } = useSyncStore();

  const [columnasExtra, setColumnasExtra] = useState<ColumnaExtra[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar al montar
  useEffect(() => {
    cargarPersonas();
    contarPendientes();
    setColumnasExtra(dbColumnas.obtenerPorTabla('personas'));
  }, []);

  // Debounce búsqueda
  const handleBusqueda = (texto: string) => {
    setTextoBusqueda(texto);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setBusqueda(texto), DEBOUNCE_MS);
  };

  // Ordenamiento cíclico: sin orden → asc → desc → sin orden
  const handleSort = (campo: string) => {
    const actual = filtro.orden;
    if (!actual || actual.campo !== campo) {
      setOrden(campo, 'asc');
    } else if (actual.direccion === 'asc') {
      setOrden(campo, 'desc');
    } else {
      // Quitar orden — volver a nombre ASC
      setOrden('nombre', 'asc');
    }
  };

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    cargarPersonas();
    contarPendientes();
    setRefreshing(false);
  }, []);

  const columnasFijas = [
    { campo: 'numero_elemento', etiqueta: 'N°', ancho: 80 },
    { campo: 'nombre', etiqueta: 'Nombre', ancho: 160 },
  ];

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.barraTop}>
        <View style={styles.inputWrapper}>
          <Ionicons name="search" size={16} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Buscar por nombre…"
            placeholderTextColor="#94a3b8"
            value={textoBusqueda}
            onChangeText={handleBusqueda}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {textoBusqueda.length > 0 && (
            <TouchableOpacity onPress={() => handleBusqueda('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Botón nuevo */}
        <TouchableOpacity
          style={styles.botonNuevo}
          onPress={() => router.push('/(tabs)/personas/nueva')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Fila de filtros (solo admins) */}
      {esAdmin && (
        <TouchableOpacity
          style={[styles.filtroEliminados, filtro.mostrarEliminados && styles.filtroEliminadosActivo]}
          onPress={toggleMostrarEliminados}
          activeOpacity={0.7}
        >
          <Ionicons
            name={filtro.mostrarEliminados ? 'eye' : 'eye-off'}
            size={14}
            color={filtro.mostrarEliminados ? '#dc2626' : '#64748b'}
          />
          <Text style={[styles.filtroTexto, filtro.mostrarEliminados && styles.filtroTextoActivo]}>
            {filtro.mostrarEliminados ? 'Mostrando eliminados' : 'Ocultar eliminados'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Indicador de carga */}
      {cargando && !refreshing && (
        <ActivityIndicator size="small" color="#1e40af" style={styles.spinner} />
      )}

      {/* Tabla con scroll vertical */}
      <ScrollView
        style={styles.tablaScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1e40af']} />
        }
      >
        <TablaVista
          datos={personas as unknown as Record<string, unknown>[]}
          columnasFijas={columnasFijas}
          columnasExtra={columnasExtra}
          onPressFila={(id) => router.push(`/(tabs)/personas/${id}`)}
          onSort={handleSort}
          ordenActual={filtro.orden as OrdenColumna | undefined}
        />
        {/* Espacio inferior */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Contador de registros */}
      <View style={styles.footer}>
        <Text style={styles.footerTexto}>
          {personas.length} {personas.length === 1 ? 'registro' : 'registros'}
          {filtro.busqueda ? ` · buscando "${filtro.busqueda}"` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  barraTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  searchIcon: {},
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    height: 40,
  },
  botonNuevo: {
    width: 40,
    height: 40,
    backgroundColor: '#1e40af',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filtroEliminados: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filtroEliminadosActivo: { backgroundColor: '#fef2f2' },
  filtroTexto: { fontSize: 12, color: '#64748b' },
  filtroTextoActivo: { color: '#dc2626', fontWeight: '600' },
  spinner: { marginVertical: 8 },
  tablaScroll: { flex: 1 },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerTexto: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
});