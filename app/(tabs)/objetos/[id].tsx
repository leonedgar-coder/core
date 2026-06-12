import { View, Text, StyleSheet } from 'react-native';

export default function DetalleObjetoScreen() {
  return (
    <View style={styles.container}>
      <Text>Detalle Objeto</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});