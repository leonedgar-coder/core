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
    try {
      // Si tiene foto local pero no foto_url → subir primero
      let fotoUrl = persona.foto_url;
      if (persona.foto_local && !persona.foto_url) {
        try {
          fotoUrl = await subirFoto('personas', persona.id, userId, persona.foto_local);
          dbPersonas.actualizar(persona.id, { foto_url: fotoUrl });
        } catch {
          // No bloquear la sync por un error de foto
          console.warn(`No se pudo subir foto de persona ${persona.id}`);
        }
      }

      if (persona.pendiente_eliminar) {
        // Soft delete en Supabase
        await supabase
          .from('personas')
          .update({ eliminado: true, actualizado_en: new Date().toISOString() })
          .eq('id', persona.id);
      } else {
        // Upsert en Supabase
        const { error } = await supabase.from('personas').upsert({
          id: persona.id,
          nombre: persona.nombre,
          numero_elemento: persona.numero_elemento ?? null,
          fecha_registro: persona.fecha_registro ?? null,
          foto_url: fotoUrl ?? null,
          datos_extra: persona.datos_extra,
          creado_por: userId,
          creado_en: persona.creado_en,
          actualizado_en: persona.actualizado_en,
          eliminado: persona.eliminado,
        });
        if (error) throw error;
      }

      // Marcar como sincronizado en SQLite
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
    try {
      let fotoUrl = objeto.foto_url;
      if (objeto.foto_local && !objeto.foto_url) {
        try {
          fotoUrl = await subirFoto('objetos', objeto.id, userId, objeto.foto_local);
          dbObjetos.actualizar(objeto.id, { foto_url: fotoUrl });
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