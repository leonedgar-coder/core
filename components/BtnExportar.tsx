/**
 * components/BtnExportar.tsx — Botón de exportación para el header
 * Muestra Alert con opciones CSV / PDF y ActivityIndicator mientras genera
 */
import { useState } from 'react';
import { TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { exportarCSV, exportarPDF } from '@/lib/exportar';
import type { TablaDB } from '@/types';

interface Props {
  tabla: TablaDB;
}

export default function BtnExportar({ tabla }: Props) {
  const [exportando, setExportando] = useState(false);

  const handleExportar = () => {
    Alert.alert(
      'Exportar',
      `¿En qué formato quieres exportar ${tabla}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '📄 CSV',
          onPress: async () => {
            setExportando(true);
            try {
              await exportarCSV(tabla);
            } catch (e: unknown) {
              Alert.alert('Error al exportar', e instanceof Error ? e.message : String(e));
            } finally {
              setExportando(false);
            }
          },
        },
        {
          text: '📑 PDF',
          onPress: async () => {
            setExportando(true);
            try {
              await exportarPDF(tabla);
            } catch (e: unknown) {
              Alert.alert('Error al exportar', e instanceof Error ? e.message : String(e));
            } finally {
              setExportando(false);
            }
          },
        },
      ]
    );
  };

  if (exportando) {
    return <ActivityIndicator size="small" color="#1e40af" style={{ marginRight: 8 }} />;
  }

  return (
    <TouchableOpacity
      onPress={handleExportar}
      style={{ padding: 6 }}
      activeOpacity={0.7}
    >
      <Ionicons name="download-outline" size={22} color="#1e40af" />
    </TouchableOpacity>
  );
}
