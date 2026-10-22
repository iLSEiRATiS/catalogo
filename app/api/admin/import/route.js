import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { MAX_FILE_BYTES, importProducts, parseSpreadsheet } from "@/lib/importer";

/** Recibe multipart con campo "file" (.csv/.xlsx) y sincroniza (upsert por SKU). */
export async function POST(req) {
  if (!(await getSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file !== "object" || !file.name) {
      return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "El archivo supera los 5 MB." }, { status: 413 });
    }

    const rows = parseSpreadsheet(Buffer.from(await file.arrayBuffer()), file.name);
    return NextResponse.json(importProducts(rows));
  } catch (e) {
    return NextResponse.json({ error: e.message || "No se pudo procesar el archivo." }, { status: 400 });
  }
}
