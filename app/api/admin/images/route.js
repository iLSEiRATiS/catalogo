import { NextResponse } from "next/server";
import path from "node:path";
import { getSession } from "@/lib/auth";
import { getProduct, getProductBySku, updateProduct } from "@/lib/products";
import { removeImage, saveImage } from "@/lib/images";

/**
 * Subida de imágenes (multipart, campo "files").
 *  - Con `productId`: asocia la (única) imagen a ese producto.
 *  - Sin `productId`: vincula por SKU -> el nombre del archivo (sin extensión) debe ser el SKU.
 *    Ej: "REM-001.jpg" se asigna al producto con SKU "REM-001".
 */
export async function POST(req) {
  if (!(await getSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const form = await req.formData();
  const files = form.getAll("files").filter((f) => typeof f === "object" && f.name);
  const productId = form.get("productId");
  if (files.length === 0) return NextResponse.json({ error: "No se recibieron archivos." }, { status: 400 });

  const result = { vinculadas: 0, errores: [] };

  for (const file of files) {
    try {
      const product = productId
        ? getProduct(Number(productId))
        : getProductBySku(path.parse(file.name).name.trim());
      if (!product) throw new Error("No se encontró un producto con ese SKU");

      const saved = await saveImage(file, product.sku);
      await removeImage(product.imagen); // reemplaza la anterior
      updateProduct(product.id, { imagen: saved });
      result.vinculadas++;
      result.ultimo = saved;
    } catch (e) {
      result.errores.push({ archivo: file.name, error: e.message });
    }
  }
  return NextResponse.json(result);
}
