import * as SQLite from 'expo-sqlite';
import type { Persona, Objeto, ColumnaExtra, TablaDB, FiltroTabla } from '@/types';

// ---------------------------------------------------------------------------
// Abrir base de datos
// ---------------------------------------------------------------------------
const db = SQLite.openDatabaseSync('bd_colaborativa.db');

// ---------------------------------------------------------------------------
// PASO 4.1 — Inicialización del schema
// ---------------------------------------------------------------------------
export function inicializarDB(): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS personas_local (
      id                TEXT PRIMARY KEY,
      numero_elemento   TEXT,
      nombre            TEXT NOT NULL,
      foto_local        TEXT,
      foto_url          TEXT,
      fecha_registro    TEXT,
      datos_extra       TEXT NOT NULL DEFAULT '{}',
      creado_por        TEXT NOT NULL,
      creado_en         TEXT NOT NULL,
      actualizado_en    TEXT NOT NULL,
      eliminado         INTEGER NOT NULL DEFAULT 0,
      sincronizado      INTEGER NOT NULL DEFAULT 0,
      pendiente_eliminar INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS objetos_local (
      id                TEXT PRIMARY KEY,
      tipo              TEXT,
      nombre            TEXT NOT NULL,
      foto_local        TEXT,
      foto_url          TEXT,
      descripcion       TEXT,
      datos_extra       TEXT NOT NULL DEFAULT '{}',
      creado_por        TEXT NOT NULL,
      creado_en         TEXT NOT NULL,
      actualizado_en    TEXT NOT NULL,
      eliminado         INTEGER NOT NULL DEFAULT 0,
      sincronizado      INTEGER NOT NULL DEFAULT 0,
      pendiente_eliminar INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS columnas_extra_local (
      id           TEXT PRIMARY KEY,
      tabla        TEXT NOT NULL,
      nombre_campo TEXT NOT NULL,
      etiqueta     TEXT NOT NULL,
      tipo         TEXT NOT NULL,
      opciones     TEXT,
      requerido    INTEGER NOT NULL DEFAULT 0,
      activa       INTEGER NOT NULL DEFAULT 1,
      orden        INTEGER NOT NULL DEFAULT 0,
      creado_en    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
  `);
}

// Inicializar al importar el módulo
inicializarDB();

// ---------------------------------------------------------------------------
// HELPERS: deserialización
// ---------------------------------------------------------------------------
function parseDatosExtra(raw: string): Record<string, unknown> {
  try { return JSON.parse(raw); } catch { return {}; }
}

function parseOpciones(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function rowToPersona(row: Record<string, unknown>): Persona {
  return {
    id: row.id as string,
    numero_elemento: (row.numero_elemento as string | null) ?? undefined,
    nombre: row.nombre as string,
    foto_local: (row.foto_local as string | null) ?? undefined,
    foto_url: (row.foto_url as string | null) ?? undefined,
    fecha_registro: (row.fecha_registro as string | null) ?? undefined,
    datos_extra: parseDatosExtra(row.datos_extra as string),
    creado_por: row.creado_por as string,
    creado_en: row.creado_en as string,
    actualizado_en: row.actualizado_en as string,
    eliminado: (row.eliminado as number) === 1,
    sincronizado: (row.sincronizado as number) === 1,
    pendiente_eliminar: (row.pendiente_eliminar as number) === 1,
  };
}

function rowToObjeto(row: Record<string, unknown>): Objeto {
  return {
    id: row.id as string,
    tipo: (row.tipo as string | null) ?? undefined,
    nombre: row.nombre as string,
    foto_local: (row.foto_local as string | null) ?? undefined,
    foto_url: (row.foto_url as string | null) ?? undefined,
    descripcion: (row.descripcion as string | null) ?? undefined,
    datos_extra: parseDatosExtra(row.datos_extra as string),
    creado_por: row.creado_por as string,
    creado_en: row.creado_en as string,
    actualizado_en: row.actualizado_en as string,
    eliminado: (row.eliminado as number) === 1,
    sincronizado: (row.sincronizado as number) === 1,
    pendiente_eliminar: (row.pendiente_eliminar as number) === 1,
  };
}

function rowToColumna(row: Record<string, unknown>): ColumnaExtra {
  return {
    id: row.id as string,
    tabla: row.tabla as TablaDB,
    nombre_campo: row.nombre_campo as string,
    etiqueta: row.etiqueta as string,
    tipo: row.tipo as ColumnaExtra['tipo'],
    opciones: parseOpciones(row.opciones as string | null),
    requerido: (row.requerido as number) === 1,
    activa: (row.activa as number) === 1,
    orden: row.orden as number,
    creado_en: row.creado_en as string,
  };
}

// ===========================================================================
// PASO 4.2 — CRUD PERSONAS
// ===========================================================================

export function obtenerTodasPersonas(filtro: FiltroTabla): Persona[] {
  const partes: string[] = ['SELECT * FROM personas_local WHERE 1=1'];
  const params: (string | number)[] = [];

  if (!filtro.mostrarEliminados) {
    partes.push('AND eliminado = 0');
  }
  if (filtro.busqueda.trim()) {
    partes.push('AND nombre LIKE ?');
    params.push(`%${filtro.busqueda.trim()}%`);
  }
  if (filtro.orden) {
    const dir = filtro.orden.direccion.toUpperCase();
    const camposBase = ['numero_elemento', 'nombre', 'fecha_registro', 'creado_en', 'actualizado_en'];
    if (camposBase.includes(filtro.orden.campo)) {
      partes.push(`ORDER BY ${filtro.orden.campo} ${dir}`);
    } else {
      partes.push(`ORDER BY json_extract(datos_extra, '$.${filtro.orden.campo}') ${dir}`);
    }
  } else {
    partes.push('ORDER BY nombre ASC');
  }

  const rows = db.getAllSync(partes.join(' '), params) as Record<string, unknown>[];
  return rows.map(rowToPersona);
}

export function obtenerPersonaPorId(id: string): Persona | null {
  const row = db.getFirstSync(
    'SELECT * FROM personas_local WHERE id = ?',
    [id]
  ) as Record<string, unknown> | null;
  return row ? rowToPersona(row) : null;
}

export function insertarPersona(persona: Omit<Persona, 'sincronizado' | 'pendiente_eliminar'>): void {
  db.runSync(
    `INSERT INTO personas_local
      (id, numero_elemento, nombre, foto_local, foto_url, fecha_registro,
       datos_extra, creado_por, creado_en, actualizado_en, eliminado, sincronizado, pendiente_eliminar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      persona.id,
      persona.numero_elemento ?? null,
      persona.nombre,
      persona.foto_local ?? null,
      persona.foto_url ?? null,
      persona.fecha_registro ?? null,
      JSON.stringify(persona.datos_extra),
      persona.creado_por,
      persona.creado_en,
      persona.actualizado_en,
      persona.eliminado ? 1 : 0,
    ]
  );
}

export function actualizarPersona(id: string, cambios: Partial<Persona>): void {
  const ahora = new Date().toISOString();
  const sets: string[] = ['actualizado_en = ?', 'sincronizado = 0'];
  const vals: (string | number | null)[] = [ahora];

  if (cambios.nombre !== undefined)           { sets.push('nombre = ?');           vals.push(cambios.nombre); }
  if (cambios.numero_elemento !== undefined)  { sets.push('numero_elemento = ?');  vals.push(cambios.numero_elemento ?? null); }
  if (cambios.foto_local !== undefined)       { sets.push('foto_local = ?');       vals.push(cambios.foto_local ?? null); }
  if (cambios.foto_url !== undefined)         { sets.push('foto_url = ?');         vals.push(cambios.foto_url ?? null); }
  if (cambios.fecha_registro !== undefined)   { sets.push('fecha_registro = ?');   vals.push(cambios.fecha_registro ?? null); }
  if (cambios.datos_extra !== undefined)      { sets.push('datos_extra = ?');      vals.push(JSON.stringify(cambios.datos_extra)); }

  vals.push(id);
  db.runSync(`UPDATE personas_local SET ${sets.join(', ')} WHERE id = ?`, vals);
}

export function marcarEliminadaPersona(id: string): void {
  db.runSync(
    `UPDATE personas_local
     SET eliminado = 1, pendiente_eliminar = 1, sincronizado = 0, actualizado_en = ?
     WHERE id = ?`,
    [new Date().toISOString(), id]
  );
}

export function upsertPersonaDesdeSync(persona: Persona): void {
  db.runSync(
    `INSERT OR REPLACE INTO personas_local
      (id, numero_elemento, nombre, foto_local, foto_url, fecha_registro,
       datos_extra, creado_por, creado_en, actualizado_en, eliminado, sincronizado, pendiente_eliminar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      persona.id,
      persona.numero_elemento ?? null,
      persona.nombre,
      persona.foto_local ?? null,
      persona.foto_url ?? null,
      persona.fecha_registro ?? null,
      JSON.stringify(persona.datos_extra),
      persona.creado_por,
      persona.creado_en,
      persona.actualizado_en,
      persona.eliminado ? 1 : 0,
    ]
  );
}

export function obtenerPersonasPendientes(): Persona[] {
  const rows = db.getAllSync(
    'SELECT * FROM personas_local WHERE sincronizado = 0',
    []
  ) as Record<string, unknown>[];
  return rows.map(rowToPersona);
}

// Objeto agrupador para personas
export const dbPersonas = {
  obtenerTodas: obtenerTodasPersonas,
  obtenerPorId: obtenerPersonaPorId,
  insertar: insertarPersona,
  actualizar: actualizarPersona,
  marcarEliminada: marcarEliminadaPersona,
  upsertDesdeSync: upsertPersonaDesdeSync,
  obtenerPendientes: obtenerPersonasPendientes,
};

// ===========================================================================
// PASO 4.3 — CRUD OBJETOS
// ===========================================================================

export function obtenerTodosObjetos(filtro: FiltroTabla): Objeto[] {
  const partes: string[] = ['SELECT * FROM objetos_local WHERE 1=1'];
  const params: (string | number)[] = [];

  if (!filtro.mostrarEliminados) {
    partes.push('AND eliminado = 0');
  }
  if (filtro.busqueda.trim()) {
    partes.push('AND nombre LIKE ?');
    params.push(`%${filtro.busqueda.trim()}%`);
  }
  if (filtro.orden) {
    const dir = filtro.orden.direccion.toUpperCase();
    const camposBase = ['tipo', 'nombre', 'descripcion', 'creado_en', 'actualizado_en'];
    if (camposBase.includes(filtro.orden.campo)) {
      partes.push(`ORDER BY ${filtro.orden.campo} ${dir}`);
    } else {
      partes.push(`ORDER BY json_extract(datos_extra, '$.${filtro.orden.campo}') ${dir}`);
    }
  } else {
    partes.push('ORDER BY nombre ASC');
  }

  const rows = db.getAllSync(partes.join(' '), params) as Record<string, unknown>[];
  return rows.map(rowToObjeto);
}

export function obtenerObjetoPorId(id: string): Objeto | null {
  const row = db.getFirstSync(
    'SELECT * FROM objetos_local WHERE id = ?',
    [id]
  ) as Record<string, unknown> | null;
  return row ? rowToObjeto(row) : null;
}

export function insertarObjeto(objeto: Omit<Objeto, 'sincronizado' | 'pendiente_eliminar'>): void {
  db.runSync(
    `INSERT INTO objetos_local
      (id, tipo, nombre, foto_local, foto_url, descripcion,
       datos_extra, creado_por, creado_en, actualizado_en, eliminado, sincronizado, pendiente_eliminar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      objeto.id,
      objeto.tipo ?? null,
      objeto.nombre,
      objeto.foto_local ?? null,
      objeto.foto_url ?? null,
      objeto.descripcion ?? null,
      JSON.stringify(objeto.datos_extra),
      objeto.creado_por,
      objeto.creado_en,
      objeto.actualizado_en,
      objeto.eliminado ? 1 : 0,
    ]
  );
}

export function actualizarObjeto(id: string, cambios: Partial<Objeto>): void {
  const ahora = new Date().toISOString();
  const sets: string[] = ['actualizado_en = ?', 'sincronizado = 0'];
  const vals: (string | number | null)[] = [ahora];

  if (cambios.nombre !== undefined)      { sets.push('nombre = ?');      vals.push(cambios.nombre); }
  if (cambios.tipo !== undefined)        { sets.push('tipo = ?');        vals.push(cambios.tipo ?? null); }
  if (cambios.descripcion !== undefined) { sets.push('descripcion = ?'); vals.push(cambios.descripcion ?? null); }
  if (cambios.foto_local !== undefined)  { sets.push('foto_local = ?');  vals.push(cambios.foto_local ?? null); }
  if (cambios.foto_url !== undefined)    { sets.push('foto_url = ?');    vals.push(cambios.foto_url ?? null); }
  if (cambios.datos_extra !== undefined) { sets.push('datos_extra = ?'); vals.push(JSON.stringify(cambios.datos_extra)); }

  vals.push(id);
  db.runSync(`UPDATE objetos_local SET ${sets.join(', ')} WHERE id = ?`, vals);
}

export function marcarEliminadoObjeto(id: string): void {
  db.runSync(
    `UPDATE objetos_local
     SET eliminado = 1, pendiente_eliminar = 1, sincronizado = 0, actualizado_en = ?
     WHERE id = ?`,
    [new Date().toISOString(), id]
  );
}

export function upsertObjetoDesdeSync(objeto: Objeto): void {
  db.runSync(
    `INSERT OR REPLACE INTO objetos_local
      (id, tipo, nombre, foto_local, foto_url, descripcion,
       datos_extra, creado_por, creado_en, actualizado_en, eliminado, sincronizado, pendiente_eliminar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      objeto.id,
      objeto.tipo ?? null,
      objeto.nombre,
      objeto.foto_local ?? null,
      objeto.foto_url ?? null,
      objeto.descripcion ?? null,
      JSON.stringify(objeto.datos_extra),
      objeto.creado_por,
      objeto.creado_en,
      objeto.actualizado_en,
      objeto.eliminado ? 1 : 0,
    ]
  );
}

export function obtenerObjetosPendientes(): Objeto[] {
  const rows = db.getAllSync(
    'SELECT * FROM objetos_local WHERE sincronizado = 0',
    []
  ) as Record<string, unknown>[];
  return rows.map(rowToObjeto);
}

export const dbObjetos = {
  obtenerTodos: obtenerTodosObjetos,
  obtenerPorId: obtenerObjetoPorId,
  insertar: insertarObjeto,
  actualizar: actualizarObjeto,
  marcarEliminado: marcarEliminadoObjeto,
  upsertDesdeSync: upsertObjetoDesdeSync,
  obtenerPendientes: obtenerObjetosPendientes,
};

// ===========================================================================
// PASO 4.3 — CRUD COLUMNAS EXTRA
// ===========================================================================

export function obtenerColumnasPorTabla(tabla: TablaDB): ColumnaExtra[] {
  const rows = db.getAllSync(
    'SELECT * FROM columnas_extra_local WHERE tabla = ? AND activa = 1 ORDER BY orden ASC',
    [tabla]
  ) as Record<string, unknown>[];
  return rows.map(rowToColumna);
}

export function obtenerTodasColumnas(): ColumnaExtra[] {
  const rows = db.getAllSync(
    'SELECT * FROM columnas_extra_local WHERE activa = 1 ORDER BY tabla ASC, orden ASC',
    []
  ) as Record<string, unknown>[];
  return rows.map(rowToColumna);
}

export function upsertColumnaDesdeSync(columna: ColumnaExtra): void {
  db.runSync(
    `INSERT OR REPLACE INTO columnas_extra_local
      (id, tabla, nombre_campo, etiqueta, tipo, opciones, requerido, activa, orden, creado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      columna.id,
      columna.tabla,
      columna.nombre_campo,
      columna.etiqueta,
      columna.tipo,
      columna.opciones ? JSON.stringify(columna.opciones) : null,
      columna.requerido ? 1 : 0,
      columna.activa ? 1 : 0,
      columna.orden,
      columna.creado_en,
    ]
  );
}

export const dbColumnas = {
  obtenerPorTabla: obtenerColumnasPorTabla,
  obtenerTodas: obtenerTodasColumnas,
  upsertDesdeSync: upsertColumnaDesdeSync,
};

// ===========================================================================
// PASO 4.3 — SYNC META
// ===========================================================================

export function getUltimaSync(tabla: TablaDB | 'columnas'): string {
  const row = db.getFirstSync(
    'SELECT valor FROM sync_meta WHERE clave = ?',
    [`ultima_sync_${tabla}`]
  ) as { valor: string } | null;
  return row?.valor ?? '1970-01-01T00:00:00Z';
}

export function setUltimaSync(tabla: TablaDB | 'columnas', timestamp: string): void {
  db.runSync(
    'INSERT OR REPLACE INTO sync_meta (clave, valor) VALUES (?, ?)',
    [`ultima_sync_${tabla}`, timestamp]
  );
}

export const dbMeta = {
  getUltimaSync,
  setUltimaSync,
};

// Exportar db para uso directo si es necesario
export { db };