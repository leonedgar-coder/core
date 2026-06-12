$base = "d:\DOCUMENTOS\Programar\acts\core\bd-colaborativa"

# Crear carpetas
$folders = @(
  "app/(auth)",
  "app/(tabs)/personas",
  "app/(tabs)/objetos",
  "app/(tabs)/admin",
  "components",
  "lib",
  "store",
  "types"
)
foreach ($f in $folders) {
  New-Item -ItemType Directory -Path "$base\$f" -Force | Out-Null
}

# Helper para crear archivo si no existe
function Write-File($path, $content) {
  $full = "$base\$path"
  if (-not (Test-Path $full)) {
    [System.IO.File]::WriteAllText($full, $content, [System.Text.Encoding]::UTF8)
  }
}

# app/_layout.tsx
Write-File "app/_layout.tsx" @"
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
"@

# app/(auth)/login.tsx
Write-File "app/(auth)/login.tsx" @"
import { View, Text, StyleSheet } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text>Login</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
"@

# app/(tabs)/_layout.tsx
Write-File "app/(tabs)/_layout.tsx" @"
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
"@

# Pantallas de personas
Write-File "app/(tabs)/personas/index.tsx" @"
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
"@

Write-File "app/(tabs)/personas/[id].tsx" @"
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
"@

Write-File "app/(tabs)/personas/nueva.tsx" @"
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
"@

# Pantallas de objetos
Write-File "app/(tabs)/objetos/index.tsx" @"
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
"@

Write-File "app/(tabs)/objetos/[id].tsx" @"
import { View, Text, StyleSheet } from 'react-native';

export default function DetalleObjetoScreen() {
  return (
    <View style={styles.container}>
      <Text>Detalle Objeto</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
"@

Write-File "app/(tabs)/objetos/nueva.tsx" @"
import { View, Text, StyleSheet } from 'react-native';

export default function NuevoObjetoScreen() {
  return (
    <View style={styles.container}>
      <Text>Nuevo Objeto</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
"@

# Pantallas de admin
Write-File "app/(tabs)/admin/columnas.tsx" @"
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
"@

Write-File "app/(tabs)/admin/usuarios.tsx" @"
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
"@

# Componentes
Write-File "components/FormularioDinamico.tsx" @"
import { View } from 'react-native';

interface FormularioDinamicoProps {
  tabla: 'personas' | 'objetos';
}

export default function FormularioDinamico(_props: FormularioDinamicoProps) {
  return <View />;
}
"@

Write-File "components/TablaVista.tsx" @"
import { View } from 'react-native';

export default function TablaVista() {
  return <View />;
}
"@

Write-File "components/FotoPicker.tsx" @"
import { View } from 'react-native';

export default function FotoPicker() {
  return <View />;
}
"@

Write-File "components/SyncIndicator.tsx" @"
import { View } from 'react-native';

export default function SyncIndicator() {
  return <View />;
}
"@

# Lib
Write-File "lib/supabase.ts" @"
// TODO: Implementar en Paso 2.4
export {};
"@

Write-File "lib/db.ts" @"
// TODO: Implementar en Fase 4
export {};
"@

Write-File "lib/sync.ts" @"
// TODO: Implementar en Fase 9
export {};
"@

Write-File "lib/exportar.ts" @"
// TODO: Implementar en Fase 11
export {};
"@

# Stores
Write-File "store/useAuthStore.ts" @"
import { create } from 'zustand';

interface AuthState {
  usuario: null;
}

export const useAuthStore = create<AuthState>(() => ({
  usuario: null,
}));
"@

Write-File "store/usePersonasStore.ts" @"
import { create } from 'zustand';

interface PersonasState {
  personas: never[];
}

export const usePersonasStore = create<PersonasState>(() => ({
  personas: [],
}));
"@

Write-File "store/useObjetosStore.ts" @"
import { create } from 'zustand';

interface ObjetosState {
  objetos: never[];
}

export const useObjetosStore = create<ObjetosState>(() => ({
  objetos: [],
}));
"@

Write-File "store/useSyncStore.ts" @"
import { create } from 'zustand';

interface SyncState {
  estado: 'idle';
}

export const useSyncStore = create<SyncState>(() => ({
  estado: 'idle',
}));
"@

# Types
Write-File "types/index.ts" @"
// TODO: Implementar en Paso 1.5 (Fase 1)
// Tipos del proyecto BD Colaborativa
"@

Write-Host "✅ Estructura de archivos creada correctamente"
