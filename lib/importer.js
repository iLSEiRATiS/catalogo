import Papa from "papaparse";
import * as XLSX from "xlsx";
import { db } from "./db";

/**
 * Importación masiva (CSV / XLSX) con lógica de sincronización UPSERT por SKU.
 *
 * Columnas aceptadas: sku, nombre, descripcion, categoria, precio, stock, imagen_url
 * (se toleran mayúsculas, acentos y algunos alias: "código", "imagen", etc.)
 *
 * Reglas:
 *  - SKU existente  -> actualiza solo los campos que vengan con valor (celda vacía = no tocar).
 *  - SKU nuevo      -> crea el producto (nombre y precio obligatorios).
 */

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 20000;

const ALIASES = {
  sku: ["sku", "codigo", "cod", "code"],
  nombre: ["nombre", "name", "producto", "titulo"],
  descripcion: ["descripcion", "description", "detalle"],
  categoria: ["categoria", "category", "rubro"],
  precio: ["precio", "price", "importe"],
  stock: ["stock", "cantidad", "existencia", "disponible"],
  imagen: ["imagen_url", "imagen", "image", "image_url", "foto", "url_imagen"],
};

/** "Código de Barras " -> "codigo_de_barras" */
function normalizeHeader(h) {
  return String(h ?? "")
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Mapea cada fila a las claves canónicas (sku, nombre, ...). */
function canonicalizeRow(raw) {
  const out = {};
  const keys = Object.keys(raw);
  for (const [canon, aliases] of Object.entries(ALIASES)) {
    const found = keys.find((k) => aliases.includes(normalizeHeader(k)));
    out[canon] = found !== undefined ? raw[found] : undefined;
  }
  return out;
}

function decodeCsv(buffer) {
  let text = new TextDecoder("utf-8").decode(buffer);
  // Excel en Windows suele guardar CSV en ANSI/latin1: reintentar si hay caracteres inválidos.
  if (text.includes("\uFFFD")) text = new TextDecoder("windows-1252").decode(buffer);
  return text;
}

/** Lee el archivo y devuelve un array de objetos {sku, nombre, ...} crudos. */
export function parseSpreadsheet(buffer, filename) {
  const ext = filename.toLowerCase().split(".").pop();
  let rawRows;

  if (ext === "csv") {
    const res = Papa.parse(decodeCsv(buffer), {
      header: true,
      skipEmptyLines: "greedy",
      delimiter: "", // autodetecta "," o ";" (Excel en español usa ";")
    });
    rawRows = res.data;
  } else if (ext === "xlsx" || ext === "xls") {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) throw new Error("El archivo Excel no tiene hojas.");
    rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
  } else {
    throw new Error("Formato no soportado. Subí un archivo .csv o .xlsx");
  }

  if (rawRows.length === 0) throw new Error("El archivo no contiene filas de datos.");
  if (rawRows.length > MAX_ROWS) throw new Error(`Máximo ${MAX_ROWS} filas por archivo.`);

  const rows = rawRows.map(canonicalizeRow);
  if (rows.every((r) => r.sku === undefined)) {
    throw new Error('No se encontró la columna "sku". Descargá la plantilla de ejemplo.');
  }
  return rows;
}

const isEmpty = (v) => v === undefined || v === null || String(v).trim() === "";

/** Acepta 1234.56, "1.234,56", "$ 1,234.56", "1234,5" */
export function parsePrice(v) {
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : NaN;
  let s = String(v).replace(/[^\d.,-]/g, "");
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot !== -1 && lastComma !== -1) {
    // El separador que aparece último es el decimal.
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma !== -1) {
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (lastDot !== -1 && /^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ""); // "1.250" = mil doscientos cincuenta
  }
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}

/** Acepta números o palabras: si/no, true/false, disponible, agotado... */
export function parseStock(v) {
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? Math.trunc(v) : NaN;
  const s = normalizeHeader(v);
  if (["si", "yes", "true", "disponible", "con_stock", "activo"].includes(s)) return 1;
  if (["no", "false", "sin_stock", "agotado", "inactivo"].includes(s)) return 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : NaN;
}

/**
 * Impacta las filas en la base dentro de UNA transacción (rápido y atómico por lote).
 * Las filas inválidas se omiten y se reportan; el resto se procesa.
 */
export function importProducts(rows) {
  const result = { total: rows.length, creados: 0, actualizados: 0, errores: [] };

  const findExisting = db.prepare("SELECT id FROM productos WHERE sku = ?");
  // UPSERT: COALESCE(@campo, columna) => si el valor llega null se conserva el existente.
  const upsert = db.prepare(`
    INSERT INTO productos (sku, nombre, descripcion, categoria, precio, stock, imagen)
    VALUES (@sku, COALESCE(@nombre, ''), COALESCE(@descripcion, ''), COALESCE(@categoria, 'General'),
            COALESCE(@precio, 0), COALESCE(@stock, 0), COALESCE(@imagen, ''))
    ON CONFLICT(sku) DO UPDATE SET
      nombre              = COALESCE(@nombre, nombre),
      descripcion         = COALESCE(@descripcion, descripcion),
      categoria           = COALESCE(@categoria, categoria),
      precio              = COALESCE(@precio, precio),
      stock               = COALESCE(@stock, stock),
      imagen              = COALESCE(@imagen, imagen),
      fecha_actualizacion = CURRENT_TIMESTAMP
  `);

  const run = db.transaction(() => {
    rows.forEach((r, i) => {
      const fila = i + 2; // +1 por encabezado, +1 por base 1 (coincide con Excel)
      const sku = String(r.sku ?? "").trim();
      const fail = (error) => result.errores.push({ fila, sku, error });

      if (!sku) return fail("SKU vacío");

      const exists = !!findExisting.get(sku);
      const text = (v) => (isEmpty(v) ? null : String(v).trim());

      let precio = null;
      if (!isEmpty(r.precio)) {
        precio = parsePrice(r.precio);
        if (Number.isNaN(precio)) return fail(`Precio inválido: "${r.precio}"`);
      }
      let stock = null;
      if (!isEmpty(r.stock)) {
        stock = parseStock(r.stock);
        if (Number.isNaN(stock)) return fail(`Stock inválido: "${r.stock}"`);
      }
      const nombre = text(r.nombre);
      if (!exists && !nombre) return fail("Producto nuevo sin nombre");
      if (!exists && precio === null) return fail("Producto nuevo sin precio");

      upsert.run({
        sku,
        nombre,
        descripcion: text(r.descripcion),
        categoria: text(r.categoria),
        precio,
        stock,
        imagen: text(r.imagen),
      });
      exists ? result.actualizados++ : result.creados++;
    });
  });
  run();

  return result;
}
