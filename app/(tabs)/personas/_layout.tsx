import { Stack } from 'expo-router';

export default function PersonasLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Personas', headerShown: false }}
      />
      <Stack.Screen
        name="nueva"
        options={{ title: 'Nueva Persona', presentation: 'modal' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Detalle' }}
      />
    </Stack>
  );
}
