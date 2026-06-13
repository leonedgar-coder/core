/**
 * lib/exportar.ts — Exportación de datos a CSV y PDF (Fase 11)
 */
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { dbPersonas, dbObjetos, dbColumnas } from './db';
import type { TablaDB } from '@/types';

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------

/** Escapa un valor para CSV (encierra en comillas si contiene coma/newline) */
function escaparCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Timestamp compacto para nombres de archivo */
function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
}

// ---------------------------------------------------------------------------
// 11.1 — Exportar CSV
// ---------------------------------------------------------------------------
export async function exportarCSV(tabla: TablaDB): Promise<void> {
  const columnasExtra = dbColumnas.obtenerPorTabla(tabla);

  // Obtener datos crudos (sin filtros — todos los registros activos)
  const filtroVacio = { busqueda: '', mostrarEliminados: false };
  const filas = tabla === 'personas'
    ? dbPersonas.obtenerTodas(filtroVacio)
    : dbObjetos.obtenerTodos(filtroVacio);

  // Columnas fijas según tabla
  const fijasPersonas = ['numero_elemento', 'nombre', 'fecha_registro'];
  const fijasObjetos = ['nombre', 'tipo', 'descripcion'];
  const fijas = tabla === 'personas' ? fijasPersonas : fijasObjetos;

  // Encabezados: fijas primero, luego extra
  const encabezadosFijas = tabla === 'personas'
    ? ['N° Elemento', 'Nombre', 'Fecha Registro']
    : ['Nombre', 'Tipo', 'Descripción'];

  const encabezadosExtra = columnasExtra.map(c => c.etiqueta);
  const todosEncabezados = ['Foto URL', ...encabezadosFijas, ...encabezadosExtra];

  // Filas de datos
  const lineas: string[] = [
    '\uFEFF' + todosEncabezados.map(escaparCSV).join(','), // BOM UTF-8
  ];

  for (const fila of filas as unknown as Record<string, unknown>[]) {
    const datosExtra = (fila.datos_extra ?? {}) as Record<string, unknown>;
    const celdas = [
      escaparCSV(fila.foto_url),
      ...fijas.map(f => escaparCSV(fila[f])),
      ...columnasExtra.map(c => escaparCSV(datosExtra[c.nombre_campo])),
    ];
    lineas.push(celdas.join(','));
  }

  const contenido = lineas.join('\n');
  const nombre = `${tabla}_${timestamp()}.csv`;
  const uri = `${FileSystem.documentDirectory}${nombre}`;

  await FileSystem.writeAsStringAsync(uri, contenido, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: `Exportar ${tabla} — CSV`,
    UTI: 'public.comma-separated-values-text',
  });
}

// ---------------------------------------------------------------------------
// 11.2 — Exportar PDF
// ---------------------------------------------------------------------------
export async function exportarPDF(tabla: TablaDB): Promise<void> {
  const columnasExtra = dbColumnas.obtenerPorTabla(tabla);

  const filtroVacio = { busqueda: '', mostrarEliminados: false };
  const filas = tabla === 'personas'
    ? dbPersonas.obtenerTodas(filtroVacio)
    : dbObjetos.obtenerTodos(filtroVacio);

  // Encabezados
  const fijasPersonas = [
    { campo: 'numero_elemento', etiqueta: 'N°' },
    { campo: 'nombre', etiqueta: 'Nombre' },
    { campo: 'fecha_registro', etiqueta: 'Fecha' },
  ];
  const fijasObjetos = [
    { campo: 'nombre', etiqueta: 'Nombre' },
    { campo: 'tipo', etiqueta: 'Tipo' },
    { campo: 'descripcion', etiqueta: 'Descripción' },
  ];
  const columnasFijas = tabla === 'personas' ? fijasPersonas : fijasObjetos;

  // Generar columnas de la tabla HTML
  const thFoto = `<th style="${estiloTH}width:54px">Foto</th>`;
  const thFijas = columnasFijas.map(c => `<th style="${estiloTH}">${c.etiqueta}</th>`).join('');
  const thExtra = columnasExtra.map(c => `<th style="${estiloTH}">${c.etiqueta}</th>`).join('');

  // Generar filas HTML
  const trFilas = (filas as unknown as Record<string, unknown>[]).map((fila, i) => {
    const datosExtra = (fila.datos_extra ?? {}) as Record<string, unknown>;
    const bg = i % 2 === 0 ? '#ffffff' : '#f0f4f8';

    // Foto — imagen circular 50x50 o celda gris
    const fotoUrl = fila.foto_url as string | undefined;
    const tdFoto = fotoUrl
      ? `<td style="${estiloTD}text-align:center">
           <img src="${fotoUrl}" width="50" height="50"
                style="border-radius:50%;object-fit:cover" />
         </td>`
      : `<td style="${estiloTD}text-align:center">
           <div style="width:50px;height:50px;border-radius:50%;
                       background:#e2e8f0;margin:auto"></div>
         </td>`;

    const tdFijas = columnasFijas
      .map(c => `<td style="${estiloTD}">${escHTML(fila[c.campo])}</td>`)
      .join('');
    const tdExtra = columnasExtra
      .map(c => `<td style="${estiloTD}">${escHTML(datosExtra[c.nombre_campo])}</td>`)
      .join('');

    return `<tr style="background:${bg}">${tdFoto}${tdFijas}${tdExtra}</tr>`;
  }).join('');

  const titulo = tabla.charAt(0).toUpperCase() + tabla.slice(1);
  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { font-family: Arial, sans-serif; font-size: 10px; word-break: break-word; margin: 0; padding: 0; }
    body { padding: 24px; }
    h1 { font-size: 16px; color: #1e3a5f; margin-bottom: 4px; }
    .subtitulo { color: #64748b; font-size: 9px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    .pie { margin-top: 12px; color: #64748b; font-size: 9px; text-align: right; }
  </style>
</head>
<body>
  <h1>Listado de ${titulo}</h1>
  <p class="subtitulo">Generado el ${fecha}</p>
  <table>
    <thead>
      <tr>${thFoto}${thFijas}${thExtra}</tr>
    </thead>
    <tbody>${trFilas}</tbody>
  </table>
  <p class="pie">Total: ${filas.length} registros</p>
</body>
</html>`;

  // base64:true devuelve el contenido del PDF como string en lugar de un archivo en cache
  // Esto evita todos los problemas de permisos de sandbox en Android (Expo Go)
  const result = await Print.printToFileAsync({
    html,
    width: 612,
    height: 792,
    base64: true,
  });

  const nombre = `${tabla}_${timestamp()}.pdf`;
  const destino = `${FileSystem.documentDirectory}${nombre}`;

  if (result.base64) {
    // Escribir directamente al documentDirectory con base64 — siempre accesible
    await FileSystem.writeAsStringAsync(destino, result.base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else {
    // Fallback: intentar copiar desde el cache (puede fallar en Expo Go)
    await FileSystem.copyAsync({ from: result.uri, to: destino });
  }

  await Sharing.shareAsync(destino, {
    mimeType: 'application/pdf',
    dialogTitle: `Exportar ${titulo} — PDF`,
    UTI: 'com.adobe.pdf',
  });
}

// ---------------------------------------------------------------------------
// Helpers HTML
// ---------------------------------------------------------------------------
function escHTML(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const estiloTH = `
  background:#1e3a5f;color:#ffffff;padding:6px 8px;
  text-align:left;font-size:9px;font-weight:bold;
`;

const estiloTD = `
  padding:5px 8px;border-bottom:1px solid #e2e8f0;
  vertical-align:middle;
`;