import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteProduct, getProduct, getProductBySku, updateProduct, validateProductInput } from "@/lib/products";
import { removeImage } from "@/lib/images";

async function guard(params) {
  if (!(await getSession())) return { res: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  const { id } = await params;
  const product = getProduct(Number(id));
  if (!product) return { res: NextResponse.json({ error: "Producto no encontrado" }, { status: 404 }) };
  return { product };
}

// Edición parcial: precio, stock (toggle), nombre, etc.
export async function PATCH(req, { params }) {
  const { res, product } = await guard(params);
  if (res) return res;

  const body = await req.json().catch(() => ({}));
  const { data, error } = validateProductInput(body, true);
  if (error) return NextResponse.json({ error }, { status: 400 });

  if (data.sku && data.sku !== product.sku) {
    const dup = getProductBySku(data.sku);
    if (dup && dup.id !== product.id) {
      return NextResponse.json({ error: `El SKU "${data.sku}" ya existe.` }, { status: 409 });
    }
  }
  // Si cambió la imagen, borrar el archivo subido anterior.
  if (data.imagen !== undefined && data.imagen !== product.imagen) await removeImage(product.imagen);

  return NextResponse.json(updateProduct(product.id, data));
}

export async function DELETE(_req, { params }) {
  const { res, product } = await guard(params);
  if (res) return res;
  deleteProduct(product.id);
  await removeImage(product.imagen);
  return NextResponse.json({ ok: true });
}
