import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "./db";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export const isRemote = (v) => /^https?:\/\//i.test(v || "");

/** Guarda un File (Web API) con nombre único. Devuelve el nombre de archivo guardado. */
export async function saveImage(file, key) {
  const ext = path.extname(file.name || "").toLowerCase();
  if (!IMAGE_TYPES[ext]) throw new Error(`Formato no permitido (${ext || "sin extensión"}). Usá JPG, PNG, WEBP o GIF.`);
  if (file.size > MAX_IMAGE_BYTES) throw new Error("La imagen supera los 5 MB.");

  const safe = String(key).replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 60);
  const name = `${safe}-${Date.now()}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return name;
}

/** Borra un archivo subido (ignora URLs externas y archivos inexistentes). */
export async function removeImage(name) {
  if (!name || isRemote(name)) return;
  await fs.rm(path.join(UPLOAD_DIR, path.basename(name)), { force: true });
}
