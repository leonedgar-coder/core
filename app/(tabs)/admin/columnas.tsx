import { View, Text, StyleSheet } from 'react-native';

export default function AdminColumnasScreen() {
  return (
    <View style={styles.container}>
      <Text>Admin Columnas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});