import { Redirect } from 'expo-router';

export default function Index() {
  // La redirección real y protección de rutas está en app/_layout.tsx
  // Este archivo solo existe para que la ruta raíz '/' no arroje "Unmatched Route".
  return <Redirect href="/(auth)/login" />;
}
