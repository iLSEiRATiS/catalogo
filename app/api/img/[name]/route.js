import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/db";
import { IMAGE_TYPES } from "@/lib/images";

// Sirve imágenes subidas desde /data/uploads (fuera de /public para persistir).
export async function GET(_req, { params }) {
  const { name } = await params;
  const safe = path.basename(name); // evita path traversal
  const type = IMAGE_TYPES[path.extname(safe).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });

  try {
    const file = await fs.readFile(path.join(UPLOAD_DIR, safe));
    return new Response(file, {
      headers: {
        "Content-Type": type,
        // El nombre cambia en cada subida, así que se puede cachear "para siempre".
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
