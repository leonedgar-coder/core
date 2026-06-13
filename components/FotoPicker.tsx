import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface FotoPickerProps {
  uri?: string;
  onSelect: (uri: string) => void;
  disabled?: boolean;
}

/**
 * FotoPicker — selector de foto con compresión automática.
 * Usa expo-image-picker + expo-image-manipulator (comprime a 80%, max 800px).
 * En Fase 8 se añade la subida a Supabase Storage.
 */
export default function FotoPicker({ uri, onSelect, disabled }: FotoPickerProps) {
  const handlePick = async () => {
    if (disabled) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    onSelect(result.assets[0].uri);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePick} activeOpacity={0.7} disabled={disabled}>
      {uri ? (
        <Image source={{ uri }} style={styles.imagen} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcono}>📷</Text>
          <Text style={styles.placeholderTexto}>Agregar foto</Text>
        </View>
      )}
      {uri && (
        <View style={styles.badge}>
          <Text style={styles.badgeTexto}>Cambiar</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    position: 'relative',
  },
  imagen: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: '#dbeafe',
  },
  placeholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#e2e8f0',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  placeholderIcono: { fontSize: 28 },
  placeholderTexto: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  badge: {
    position: 'absolute', bottom: 0, backgroundColor: '#1e40af',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeTexto: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
});