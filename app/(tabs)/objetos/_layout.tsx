import { Stack } from 'expo-router';

export default function ObjetosLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Objetos', headerShown: false }}
      />
      <Stack.Screen
        name="nueva"
        options={{ title: 'Nuevo Objeto', presentation: 'modal' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Detalle' }}
      />
    </Stack>
  );
}
