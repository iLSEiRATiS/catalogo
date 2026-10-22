import { NextResponse } from "next/server";
import { listProducts } from "@/lib/products";

// Catálogo público: siempre datos frescos (precio/stock en tiempo real).
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(listProducts(), {
    headers: { "Cache-Control": "no-store" },
  });
}
