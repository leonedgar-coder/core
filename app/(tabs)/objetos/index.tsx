import { View, Text, StyleSheet } from 'react-native';

export default function ObjetosScreen() {
  return (
    <View style={styles.container}>
      <Text>Objetos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});