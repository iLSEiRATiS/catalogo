"use client";

import { useEffect } from "react";
import { formatPrice, imageSrc } from "@/lib/format";
import { StockLabel, WhatsAppButton } from "./ProductRow";
import { IconClose } from "./Icons";

/** Detalle del producto: hoja desde abajo en celular, panel centrado en escritorio. */
export default function ProductModal({ product, onClose }) {
  useEffect(() => {
    if (!product) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [product, onClose]);

  if (!product) return null;
  const inStock = product.stock > 0;
  const fecha = new Date(product.fecha_actualizacion.replace(" ", "T") + "Z").toLocaleDateString("es-AR");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.nombre}
        onClick={(e) => e.stopPropagation()}
        className="relative grid max-h-[92vh] w-full max-w-3xl animate-pop overflow-y-auto rounded-t-3xl bg-white shadow-[0_24px_60px_-12px_rgba(36,18,63,.5)] sm:rounded-3xl md:grid-cols-2"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-white text-ink shadow-md ring-2 ring-ink transition hover:bg-sun"
        >
          <IconClose className="size-5" />
        </button>

        <div className="aspect-[4/3] bg-[#efe7f6] md:aspect-auto md:min-h-[420px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc(product)}
            alt={product.nombre}
            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
            className={`size-full object-cover ${inStock ? "" : "opacity-60 grayscale"}`}
          />
        </div>

        <div className="flex flex-col gap-3 p-5 sm:p-7">
          <p className="text-sm font-bold text-pink-deep">{product.categoria}</p>
          <h2 className="font-display text-3xl leading-tight">{product.nombre}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="tabular font-display text-4xl leading-none">{formatPrice(product.precio)}</span>
            <StockLabel inStock={inStock} />
          </div>
          <p className="text-sm text-muted">Código: <span className="font-bold text-ink">{product.sku}</span></p>
          <p className="whitespace-pre-line text-[15px] leading-relaxed">
            {product.descripcion || "Este producto todavía no tiene una descripción. Consultanos por WhatsApp."}
          </p>
          <div className="mt-auto pt-3">
            <WhatsAppButton product={product} />
            <p className="mt-2 text-center text-xs text-muted">Precio y stock actualizados el {fecha}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
