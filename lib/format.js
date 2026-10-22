// Utilidades compartidas (seguras para el cliente: sin imports de servidor).
import { waLink } from "./negocio";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 12500 -> "$ 12.500" */
export const formatPrice = (n) => money.format(Number(n) || 0);

/** URL de la imagen: externa, de /public, subida o placeholder. */
export function imageSrc(product) {
  const img = product?.imagen;
  if (!img) return "/placeholder.svg";
  if (/^https?:\/\//i.test(img) || img.startsWith("/")) return img;
  return `/api/img/${encodeURIComponent(img)}`;
}

/** Minúsculas y sin acentos, para búsquedas tolerantes ("cafe" encuentra "Café"). */
export const normalize = (s) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Link wa.me con mensaje pre-armado según disponibilidad. */
export function whatsappLink(p) {
  const text =
    p.stock > 0
      ? `Hola! Vi en el catálogo web el producto ${p.nombre} (Código: ${p.sku}) a ${formatPrice(p.precio)} y quería consultar...`
      : `Hola! Vi en el catálogo web el producto ${p.nombre} (Código: ${p.sku}) y quería consultar cuándo vuelve a haber stock.`;
  return waLink(text);
}
