/**
 * lib/sync.ts — Motor de sincronización bidireccional
 * 
 * Flujo: pullColumnas → pullPersonas → pushPersonas → pullObjetos → pushObjetos
 * Fotos: se suben ANTES del upsert para tener foto_url lista
 */
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { dbPersonas, dbObjetos, dbColumnas, dbMeta } from './db';
import { useSyncStore } from '@/store/useSyncStore';
import { usePersonasStore } from '@/store/usePersonasStore';
import { useObjetosStore } from '@/store/useObjetosStore';
import type { Persona, Objeto, ColumnaExtra } from '@/types';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
let sincronizandoAhora = false;

function getStore() {
  return useSyncStore.getState();
}

/** Error #3 — Valida que un ID sea UUID v4 válido antes de intentar push */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function esUUIDValido(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Error #2 — Convierte fecha de cualquier formato local a ISO YYYY-MM-DD
 * que PostgreSQL/Supabase acepta.
 * Formatos detectados: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD (ya correcto)
 */
function normalizarFecha(fecha?: string | null): string | null {
  if (!fecha) return null;
  // Si ya está en formato ISO YYYY-MM-DD, retornar tal cual
  if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) return fecha.substring(0, 10);
  // Detectar DD-MM-YYYY o DD/MM/YYYY
  const match = fecha.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    const [, dia, mes, anio] = match;
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  // Si no se puede parsear, retornar null para evitar error de BD
  console.warn(`Fecha con formato desconocido ignorada: ${fecha}`);
  return null;
}

// ---------------------------------------------------------------------------
// 9.1 — Subida de fotos a Supabase Storage
// ---------------------------------------------------------------------------
export async function subirFoto(
  tabla: 'personas' | 'objetos',
  registroId: string,
  userId: string,
  fotoLocalUri: string
): Promise<string> {
  // Leer archivo como base64
  const base64 = await FileSystem.readAsStringAsync(fotoLocalUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Convertir base64 a ArrayBuffer (sin Buffer de Node.js)
  const byteCharacters = atob(base64);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }

  const bucket = tabla === 'personas' ? 'fotos-personas' : 'fotos-objetos';
  const path = `${userId}/${registroId}.jpg`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, byteArray, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw new Error(`Error subiendo foto: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// 9.2 — Pull de columnas extra (sin filtro timestamp, siempre completo)
// ---------------------------------------------------------------------------
async function pullColumnas(): Promise<void> {
  const { data, error } = await supabase
    .from('columnas_extra')
    .select('*')
    .eq('activa', true)
    .order('tabla')
    .order('orden');

  if (error) throw new Error(`pullColumnas: ${error.message}`);
  if (!data) return;

  for (const col of data) {
    dbColumnas.upsertDesdeSync({
      id: col.id,
      tabla: col.tabla,
      nombre_campo: col.nombre_campo,
      etiqueta: col.etiqueta,
      tipo: col.tipo,
      opciones: Array.isArray(col.opciones) ? col.opciones : [],
      requerido: col.requerido ?? false,
      activa: col.activa ?? true,
      orden: col.orden ?? 0,
      creado_en: col.creado_en,
    } as ColumnaExtra);
  }
}

// ---------------------------------------------------------------------------
// Pull personas desde Supabase → SQLite
// ---------------------------------------------------------------------------
async function pullPersonas(userId: string, esAdmin: boolean): Promise<number> {
  const ultimaSync = dbMeta.getUltimaSync('personas');

  let query = supabase
    .from('personas')
    .select('*')
    .gt('actualizado_en', ultimaSync)
    .order('actualizado_en');

  if (!esAdmin) {
    query = query.eq('creado_por', userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`pullPersonas: ${error.message}`);
  if (!data || data.length === 0) return 0;

  for (const p of data) {
    dbPersonas.upsertDesdeSync({
      id: p.id,
      nombre: p.nombre,
      numero_elemento: p.numero_elemento ?? undefined,
      fecha_registro: p.fecha_registro ?? undefined,
      foto_url: p.foto_url ?? undefined,
      foto_local: undefined, // no pisamos la foto local
      datos_extra: typeof p.datos_extra === 'object' ? p.datos_extra : {},
      creado_por: p.creado_por,
      creado_en: p.creado_en,
      actualizado_en: p.actualizado_en,
      eliminado: p.eliminado ?? false,
    } as Persona);
  }

  return data.length;
}

// ---------------------------------------------------------------------------
// Push personas desde SQLite → Supabase
// ---------------------------------------------------------------------------
async function pushPersonas(userId: string): Promise<number> {
  const pendientes = dbPersonas.obtenerPendientes();
  let subidos = 0;

  for (const persona of pendientes) {
    // Error #3: saltar registros con ID no-UUID (datos legacy)
    if (!esUUIDValido(persona.id)) {
      console.log(`[sync] Saltando persona con ID no-UUID: ${persona.id}`);
      continue;
    }

    try {
      // Error #1: intentar subir foto; si falla, continuar sin foto_url
      let fotoUrl = persona.foto_url;
      if (persona.foto_local && !persona.foto_url) {
        try {
          // Verificar que el archivo existe antes de intentar subir
          const info = await FileSystem.getInfoAsync(persona.foto_local);
          if (info.exists) {
            fotoUrl = await subirFoto('personas', persona.id, userId, persona.foto_local);
            dbPersonas.actualizar(persona.id, { foto_url: fotoUrl });
          } else {
            console.warn(`Foto local no existe, se omite: ${persona.foto_local}`);
          }
        } catch {
          console.warn(`No se pudo subir foto de persona ${persona.id}`);
        }
      }

      if (persona.pendiente_eliminar) {
        await supabase
          .from('personas')
          .update({ eliminado: true, actualizado_en: new Date().toISOString() })
          .eq('id', persona.id);
      } else {
        // Error #2: normalizar fecha antes del upsert
        const { error } = await supabase.from('personas').upsert({
          id: persona.id,
          nombre: persona.nombre,
          numero_elemento: persona.numero_elemento ?? null,
          fecha_registro: normalizarFecha(persona.fecha_registro),
          foto_url: fotoUrl ?? null,
          datos_extra: persona.datos_extra,
          creado_por: userId,
          creado_en: persona.creado_en,
          actualizado_en: persona.actualizado_en,
          eliminado: persona.eliminado,
        });
        if (error) throw error;
      }

      dbPersonas.upsertDesdeSync({ ...persona, foto_url: fotoUrl, sincronizado: 1, pendiente_eliminar: false } as unknown as Persona);
      subidos++;
    } catch (e) {
      console.warn(`Error sincronizando persona ${persona.id}:`, e);
    }
  }

  return subidos;
}

// ---------------------------------------------------------------------------
// Pull objetos
// ---------------------------------------------------------------------------
async function pullObjetos(userId: string, esAdmin: boolean): Promise<number> {
  const ultimaSync = dbMeta.getUltimaSync('objetos');

  let query = supabase
    .from('objetos')
    .select('*')
    .gt('actualizado_en', ultimaSync)
    .order('actualizado_en');

  if (!esAdmin) {
    query = query.eq('creado_por', userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`pullObjetos: ${error.message}`);
  if (!data || data.length === 0) return 0;

  for (const o of data) {
    dbObjetos.upsertDesdeSync({
      id: o.id,
      nombre: o.nombre,
      tipo: o.tipo ?? undefined,
      descripcion: o.descripcion ?? undefined,
      foto_url: o.foto_url ?? undefined,
      foto_local: undefined,
      datos_extra: typeof o.datos_extra === 'object' ? o.datos_extra : {},
      creado_por: o.creado_por,
      creado_en: o.creado_en,
      actualizado_en: o.actualizado_en,
      eliminado: o.eliminado ?? false,
    } as Objeto);
  }

  return data.length;
}

// ---------------------------------------------------------------------------
// Push objetos
// ---------------------------------------------------------------------------
async function pushObjetos(userId: string): Promise<number> {
  const pendientes = dbObjetos.obtenerPendientes();
  let subidos = 0;

  for (const objeto of pendientes) {
    // Error #3: saltar registros con ID no-UUID (datos legacy)
    if (!esUUIDValido(objeto.id)) {
      console.log(`[sync] Saltando objeto con ID no-UUID: ${objeto.id}`);
      continue;
    }

    try {
      // Error #1: verificar existencia del archivo antes de subir
      let fotoUrl = objeto.foto_url;
      if (objeto.foto_local && !objeto.foto_url) {
        try {
          const info = await FileSystem.getInfoAsync(objeto.foto_local);
          if (info.exists) {
            fotoUrl = await subirFoto('objetos', objeto.id, userId, objeto.foto_local);
            dbObjetos.actualizar(objeto.id, { foto_url: fotoUrl });
          } else {
            console.warn(`Foto local no existe, se omite: ${objeto.foto_local}`);
          }
        } catch {
          console.warn(`No se pudo subir foto de objeto ${objeto.id}`);
        }
      }

      if (objeto.pendiente_eliminar) {
        await supabase
          .from('objetos')
          .update({ eliminado: true, actualizado_en: new Date().toISOString() })
          .eq('id', objeto.id);
      } else {
        const { error } = await supabase.from('objetos').upsert({
          id: objeto.id,
          nombre: objeto.nombre,
          tipo: objeto.tipo ?? null,
          descripcion: objeto.descripcion ?? null,
          foto_url: fotoUrl ?? null,
          datos_extra: objeto.datos_extra,
          creado_por: userId,
          creado_en: objeto.creado_en,
          actualizado_en: objeto.actualizado_en,
          eliminado: objeto.eliminado,
        });
        if (error) throw error;
      }

      dbObjetos.upsertDesdeSync({ ...objeto, foto_url: fotoUrl, sincronizado: 1, pendiente_eliminar: false } as unknown as Objeto);
      subidos++;
    } catch (e) {
      console.warn(`Error sincronizando objeto ${objeto.id}:`, e);
    }
  }

  return subidos;
}

// ---------------------------------------------------------------------------
// sincronizarTodo — punto de entrada principal
// ---------------------------------------------------------------------------
export async function sincronizarTodo(userId: string, esAdmin: boolean): Promise<void> {
  if (sincronizandoAhora) return;
  sincronizandoAhora = true;

  const store = getStore();
  store.setEstado('sincronizando');

  try {
    // 1. Columnas (siempre primero para tener esquema actualizado)
    await pullColumnas();

    // 2. Personas
    await pullPersonas(userId, esAdmin);
    await pushPersonas(userId);
    dbMeta.setUltimaSync('personas', new Date().toISOString());

    // 3. Objetos
    await pullObjetos(userId, esAdmin);
    await pushObjetos(userId);
    dbMeta.setUltimaSync('objetos', new Date().toISOString());

    // 4. Actualizar stores en memoria
    const timestamp = new Date().toISOString();
    store.setEstado('ok');
    store.setUltimaSync(timestamp);
    store.contarPendientes();

    usePersonasStore.getState().cargarPersonas();
    useObjetosStore.getState().cargarObjetos();

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    store.setError(msg);
    console.error('Error en sincronizarTodo:', msg);
  } finally {
    sincronizandoAhora = false;
  }
}

// ---------------------------------------------------------------------------
// 9.2 — Listener de red: sincroniza automáticamente al recuperar conexión
// ---------------------------------------------------------------------------
export function iniciarListenerRed(userId: string, esAdmin: boolean): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const tieneInternet = state.isConnected && state.isInternetReachable;

    if (tieneInternet) {
      useSyncStore.getState().setEstado('idle');
      // Esperar 2s para que la conexión estabilice antes de sincronizar
      setTimeout(() => {
        sincronizarTodo(userId, esAdmin);
      }, 2000);
    } else {
      useSyncStore.getState().setEstado('sin_internet');
    }
  });

  return unsubscribe;
}