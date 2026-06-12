import { View, Text, StyleSheet } from 'react-native';

export default function PersonasScreen() {
  return (
    <View style={styles.container}>
      <Text>Personas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});