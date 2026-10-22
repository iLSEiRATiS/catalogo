"use client";

import { formatPrice, imageSrc, whatsappLink } from "@/lib/format";
import { IconWhatsApp } from "./Icons";

/** Estado de stock: texto + punto de color (no depende solo del color). */
export function StockLabel({ inStock, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
        inStock ? "bg-[#d8f4e8] text-[#0b6b4c]" : "bg-[#ebe6f1] text-[#5a4d70]"
      } ${className}`}
    >
      <span className={`size-1.5 rounded-full ${inStock ? "bg-[#14a06f]" : "bg-[#8d80a3]"}`} />
      {inStock ? "Disponible" : "Sin Stock"}
    </span>
  );
}

/** CTA grande de WhatsApp (se usa en el detalle del producto). */
export function WhatsAppButton({ product, className = "" }) {
  const inStock = product.stock > 0;
  return (
    <a
      href={whatsappLink(product)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-bold transition active:scale-[0.98] ${
        inStock ? "bg-wa text-white hover:bg-wa-dark" : "bg-ink text-white hover:bg-ink/85"
      } ${className}`}
    >
      <IconWhatsApp className="size-5" />
      {inStock ? "Consultar por WhatsApp" : "Avisame cuando haya stock"}
    </a>
  );
}

/**
 * Fila de producto: pensada para escanear rápido (foto chica, nombre, disponibilidad y precio).
 * El área principal abre el detalle; el botón de WhatsApp es independiente.
 */
export default function ProductRow({ product, onOpen }) {
  const inStock = product.stock > 0;
  return (
    <li className="flex items-stretch gap-2 border-b border-[#e9e0f3] py-3 last:border-b-0 sm:gap-3">
      <button
        type="button"
        onClick={() => onOpen(product)}
        aria-label={`Ver detalle de ${product.nombre}`}
        className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
      >
        <div className={`size-16 shrink-0 overflow-hidden rounded-lg bg-[#efe7f6] sm:size-[72px] ${inStock ? "" : "opacity-50 grayscale"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc(product)}
            alt=""
            loading="lazy"
            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
            className="size-full object-cover transition duration-300 group-hover:scale-110"
          />
        </div>

        <div className={`min-w-0 flex-1 ${inStock ? "" : "opacity-70"}`}>
          <h3 className="text-[15px] font-bold leading-tight group-hover:underline group-hover:decoration-pink group-hover:decoration-2 group-hover:underline-offset-2">
            {product.nombre}
          </h3>
          <p className="mt-0.5 text-xs text-muted">Cód. {product.sku}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="tabular font-display text-xl leading-none">{formatPrice(product.precio)}</span>
            <StockLabel inStock={inStock} />
          </div>
        </div>
      </button>

      <a
        href={whatsappLink(product)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Consultar por WhatsApp: ${product.nombre}`}
        className={`flex shrink-0 flex-col items-center justify-center gap-0.5 self-center rounded-xl px-3 py-2 text-[11px] font-bold transition active:scale-95 sm:flex-row sm:gap-1.5 sm:px-3.5 sm:text-sm ${
          inStock ? "bg-wa/10 text-[#0e7a3a] hover:bg-wa hover:text-white" : "bg-[#ebe6f1] text-[#5a4d70] hover:bg-ink hover:text-white"
        }`}
      >
        <IconWhatsApp className="size-5" />
        <span>Consultar</span>
      </a>
    </li>
  );
}
