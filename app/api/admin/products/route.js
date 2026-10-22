import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createProduct, getProductBySku, validateProductInput } from "@/lib/products";

export async function POST(req) {
  if (!(await getSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { data, error } = validateProductInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (getProductBySku(data.sku)) {
    return NextResponse.json({ error: `Ya existe un producto con SKU "${data.sku}".` }, { status: 409 });
  }
  return NextResponse.json(createProduct(data), { status: 201 });
}
