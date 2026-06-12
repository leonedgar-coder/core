import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="personas" options={{ title: 'Personas' }} />
      <Tabs.Screen name="objetos" options={{ title: 'Objetos' }} />
      <Tabs.Screen name="admin" options={{ title: 'Admin' }} />
    </Tabs>
  );
}