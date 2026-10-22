import { db } from "./db";

/** Lista completa ordenada por nombre. */
export function listProducts() {
  return db.prepare("SELECT * FROM productos ORDER BY nombre COLLATE NOCASE").all();
}

export function getProduct(id) {
  return db.prepare("SELECT * FROM productos WHERE id = ?").get(id);
}

export function getProductBySku(sku) {
  return db.prepare("SELECT * FROM productos WHERE sku = ? COLLATE NOCASE").get(sku);
}

export function getStats() {
  return db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(stock > 0), 0) AS con_stock,
              COALESCE(SUM(stock = 0), 0) AS sin_stock
       FROM productos`
    )
    .get();
}

const FIELDS = ["sku", "nombre", "descripcion", "categoria", "precio", "stock", "imagen"];

/**
 * Valida y normaliza el cuerpo recibido.
 * `partial=true` permite enviar solo algunos campos (PATCH).
 * Devuelve { data } o { error }.
 */
export function validateProductInput(body, partial = false) {
  const data = {};
  for (const f of FIELDS) {
    if (body[f] === undefined) continue;
    data[f] = body[f];
  }

  if (!partial) {
    if (!String(data.sku ?? "").trim()) return { error: "El SKU es obligatorio." };
    if (!String(data.nombre ?? "").trim()) return { error: "El nombre es obligatorio." };
  }
  for (const f of ["sku", "nombre", "descripcion", "categoria", "imagen"]) {
    if (f in data) data[f] = String(data[f] ?? "").trim();
  }
  if ("sku" in data && !data.sku) return { error: "El SKU no puede estar vacío." };
  if ("nombre" in data && !data.nombre) return { error: "El nombre no puede estar vacío." };
  if ("categoria" in data && !data.categoria) data.categoria = "General";

  if ("precio" in data) {
    const p = Number(data.precio);
    if (!Number.isFinite(p) || p < 0) return { error: "Precio inválido." };
    data.precio = Math.round(p * 100) / 100;
  }
  if ("stock" in data) {
    const s = Math.trunc(Number(data.stock));
    if (!Number.isFinite(s) || s < 0) return { error: "Stock inválido." };
    data.stock = s;
  }
  return { data };
}

export function createProduct(data) {
  const row = {
    descripcion: "",
    categoria: "General",
    precio: 0,
    stock: 0,
    imagen: "",
    ...data,
  };
  const info = db
    .prepare(
      `INSERT INTO productos (sku, nombre, descripcion, categoria, precio, stock, imagen)
       VALUES (@sku, @nombre, @descripcion, @categoria, @precio, @stock, @imagen)`
    )
    .run(row);
  return getProduct(info.lastInsertRowid);
}

export function updateProduct(id, data) {
  const keys = Object.keys(data).filter((k) => FIELDS.includes(k)); // whitelist de columnas
  if (keys.length === 0) return getProduct(id);
  const set = keys.map((k) => `${k} = @${k}`).join(", ");
  db.prepare(
    `UPDATE productos SET ${set}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = @id`
  ).run({ ...data, id });
  return getProduct(id);
}

export function deleteProduct(id) {
  return db.prepare("DELETE FROM productos WHERE id = ?").run(id).changes > 0;
}
