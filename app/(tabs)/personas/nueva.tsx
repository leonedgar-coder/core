import { View, Text, StyleSheet } from 'react-native';

export default function NuevaPersonaScreen() {
  return (
    <View style={styles.container}>
      <Text>Nueva Persona</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});