import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ColumnaExtra, OrdenColumna } from '@/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface ColumnaFija {
  campo: string;
  etiqueta: string;
  ancho: number;
}

interface TablaVistaProps {
  datos: Record<string, unknown>[];
  columnasFijas: ColumnaFija[];
  columnasExtra: ColumnaExtra[];
  onPressFila: (id: string) => void;
  onSort: (campo: string) => void;
  ordenActual?: OrdenColumna;
}

// ---------------------------------------------------------------------------
// Helpers de render por tipo
// ---------------------------------------------------------------------------
function renderValor(valor: unknown, tipo: ColumnaExtra['tipo']): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  switch (tipo) {
    case 'numero':
      return String(Number(valor));
    case 'fecha':
      try {
        return format(new Date(String(valor)), 'dd/MM/yyyy', { locale: es });
      } catch {
        return String(valor);
      }
    case 'checkbox':
      return valor ? '✓' : '✗';
    case 'seleccion':
    case 'texto':
    default:
      return String(valor);
  }
}

// ---------------------------------------------------------------------------
// Encabezado de columna con icono de orden
// ---------------------------------------------------------------------------
function Encabezado({
  campo,
  etiqueta,
  ancho,
  ordenActual,
  onSort,
}: {
  campo: string;
  etiqueta: string;
  ancho: number;
  ordenActual?: OrdenColumna;
  onSort: (campo: string) => void;
}) {
  const esActivo = ordenActual?.campo === campo;
  const icono = !esActivo ? '⇅' : ordenActual.direccion === 'asc' ? '↑' : '↓';

  return (
    <TouchableOpacity
      style={[styles.encabezadoCelda, { width: ancho }]}
      onPress={() => onSort(campo)}
      activeOpacity={0.7}
    >
      <Text style={[styles.encabezadoTexto, esActivo && styles.encabezadoActivo]}>
        {etiqueta} {icono}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Celda de foto
// ---------------------------------------------------------------------------
function CeldaFoto({ uri, nombre }: { uri?: string; nombre: string }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.foto} />;
  }
  return (
    <View style={styles.fotoPlaceholder}>
      <Text style={styles.fotoInicial}>{nombre.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function TablaVista({
  datos,
  columnasFijas,
  columnasExtra,
  onPressFila,
  onSort,
  ordenActual,
}: TablaVistaProps) {
  const todasLasColumnas = [
    ...columnasFijas,
    ...columnasExtra.map((c) => ({
      campo: c.nombre_campo,
      etiqueta: c.etiqueta,
      ancho: 140,
      tipo: c.tipo,
    })),
  ];

  if (datos.length === 0) {
    return (
      <View style={styles.vacio}>
        <Text style={styles.vacioIcono}>📋</Text>
        <Text style={styles.vacioTexto}>Sin registros</Text>
        <Text style={styles.vacioSubtexto}>Toca + para agregar el primero</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
      <View>
        {/* Encabezados */}
        <View style={styles.encabezadoFila}>
          {/* Columna foto fija */}
          <View style={[styles.encabezadoCelda, { width: 56 }]}>
            <Text style={styles.encabezadoTexto}>Foto</Text>
          </View>

          {todasLasColumnas.map((col) => (
            <Encabezado
              key={col.campo}
              campo={col.campo}
              etiqueta={col.etiqueta}
              ancho={'ancho' in col ? col.ancho : 140}
              ordenActual={ordenActual}
              onSort={onSort}
            />
          ))}
        </View>

        {/* Filas */}
        <FlatList
          data={datos}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          renderItem={({ item, index }) => {
            const fotoUri = (item.foto_local ?? item.foto_url) as string | undefined;
            const nombre = String(item.nombre ?? '');
            const esPar = index % 2 === 0;

            return (
              <TouchableOpacity
                style={[styles.fila, esPar ? styles.filaPar : styles.filaImpar]}
                onPress={() => onPressFila(String(item.id))}
                activeOpacity={0.7}
              >
                {/* Foto */}
                <View style={[styles.celda, { width: 56, alignItems: 'center' }]}>
                  <CeldaFoto uri={fotoUri} nombre={nombre} />
                </View>

                {/* Columnas fijas */}
                {columnasFijas.map((col) => (
                  <View key={col.campo} style={[styles.celda, { width: col.ancho }]}>
                    <Text style={styles.celdaTexto} numberOfLines={1}>
                      {String(item[col.campo] ?? '—')}
                    </Text>
                  </View>
                ))}

                {/* Columnas extra */}
                {columnasExtra.map((col) => {
                  const datosExtra = item.datos_extra as Record<string, unknown> | undefined;
                  const valor = datosExtra?.[col.nombre_campo];
                  return (
                    <View key={col.nombre_campo} style={[styles.celda, { width: 140 }]}>
                      <Text
                        style={[
                          styles.celdaTexto,
                          col.tipo === 'checkbox' && styles.celdaCheckbox,
                        ]}
                        numberOfLines={1}
                      >
                        {renderValor(valor, col.tipo)}
                      </Text>
                    </View>
                  );
                })}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  encabezadoFila: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    borderBottomWidth: 1,
    borderBottomColor: '#1d4ed8',
  },
  encabezadoCelda: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  encabezadoTexto: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '600',
  },
  encabezadoActivo: {
    color: '#ffffff',
  },
  fila: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filaPar: { backgroundColor: '#f8fafc' },
  filaImpar: { backgroundColor: '#ffffff' },
  celda: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  celdaTexto: {
    fontSize: 13,
    color: '#0f172a',
  },
  celdaCheckbox: {
    fontSize: 15,
    textAlign: 'center',
  },
  foto: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  fotoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotoInicial: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '700',
  },
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  vacioIcono: { fontSize: 48, marginBottom: 12 },
  vacioTexto: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  vacioSubtexto: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
});