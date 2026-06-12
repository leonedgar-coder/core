import { View, Text, StyleSheet } from 'react-native';

export default function DetallePersonaScreen() {
  return (
    <View style={styles.container}>
      <Text>Detalle Persona</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});