import { View, Text, StyleSheet } from 'react-native';

export default function AdminUsuariosScreen() {
  return (
    <View style={styles.container}>
      <Text>Admin Usuarios</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});