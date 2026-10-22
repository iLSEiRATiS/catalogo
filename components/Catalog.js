"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { NEGOCIO, estadoAhora, mapsLink, waLink } from "@/lib/negocio";
import { normalize } from "@/lib/format";
import ProductRow from "./ProductRow";
import ProductModal from "./ProductModal";
import StoreInfo from "./StoreInfo";
import { IconClose, IconPin, IconSearch, IconWhatsApp } from "./Icons";

/** Guirnalda de banderines que cuelga del borde superior de la cabecera. */
function Bunting() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-0 h-11 w-full animate-bunting"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id="flags" width="200" height="44" patternUnits="userSpaceOnUse">
          <path d="M0 3 Q50 11 100 3 T200 3" fill="none" stroke="#24123f" strokeWidth="2" />
          <polygon points="6,5 40,8 22,40" fill="#ffc61a" />
          <polygon points="56,9 90,9 73,40" fill="#fffaf0" />
          <polygon points="106,8 140,5 123,38" fill="#12a594" />
          <polygon points="156,5 190,8 172,40" fill="#2f6bff" />
        </pattern>
      </defs>
      <rect width="100%" height="44" fill="url(#flags)" />
    </svg>
  );
}

export default function Catalog() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [onlyStock, setOnlyStock] = useState(false);
  const [sort, setSort] = useState("categoria");
  const [selected, setSelected] = useState(null);
  const [estado, setEstado] = useState(null);
  const deferredQuery = useDeferredValue(query);

  // Descarga el listado y lo refresca al volver a la pestaña (precio/stock en tiempo real).
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setProducts(await res.json());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  // "Abierto / Cerrado" depende de la hora actual: se calcula en el navegador y se actualiza cada minuto.
  useEffect(() => {
    const tick = () => setEstado(estadoAhora());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 60_000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, []);

  // Índice de búsqueda precalculado (nombre + SKU + categoría, sin acentos).
  const indexed = useMemo(
    () => (products ?? []).map((p) => ({ p, haystack: normalize(`${p.nombre} ${p.sku} ${p.categoria}`) })),
    [products]
  );

  // Productos que cumplen búsqueda y "solo con stock" (aún sin filtrar categoría): base de los contadores.
  const matching = useMemo(() => {
    const terms = normalize(deferredQuery).split(/\s+/).filter(Boolean);
    return indexed
      .filter(({ p, haystack }) => (!onlyStock || p.stock > 0) && terms.every((t) => haystack.includes(t)))
      .map(({ p }) => p);
  }, [indexed, deferredQuery, onlyStock]);

  const categories = useMemo(() => {
    const counts = new Map();
    (products ?? []).forEach((p) => counts.set(p.categoria, counts.get(p.categoria) ?? 0));
    matching.forEach((p) => counts.set(p.categoria, counts.get(p.categoria) + 1));
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [products, matching]);

  const visible = useMemo(() => {
    let list = category === "Todas" ? matching : matching.filter((p) => p.categoria === category);
    if (sort === "asc") list = [...list].sort((a, b) => a.precio - b.precio);
    if (sort === "desc") list = [...list].sort((a, b) => b.precio - a.precio);
    return list;
  }, [matching, category, sort]);

  // Agrupa por categoría (salvo que se ordene por precio, donde conviene una sola lista).
  const groups = useMemo(() => {
    if (sort !== "categoria") return [[null, visible]];
    const map = new Map();
    visible.forEach((p) => map.set(p.categoria, [...(map.get(p.categoria) ?? []), p]));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [visible, sort]);

  const closeModal = useCallback(() => setSelected(null), []);
  const reset = () => { setQuery(""); setCategory("Todas"); setOnlyStock(false); };
  const hasFilters = query || category !== "Todas" || onlyStock;

  return (
    <>
      {/* ───────── Cabecera ───────── */}
      <header className="relative overflow-hidden bg-pink text-white">
        <Bunting />
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-16 sm:px-6 sm:pb-12 sm:pt-20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-2xl leading-none sm:text-3xl">{NEGOCIO.nombre}</p>
              <p className="mt-1 text-sm text-white/85">{NEGOCIO.eslogan}</p>
            </div>
            <a
              href={waLink("Hola! Quería hacer una consulta.")}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-sun sm:inline-flex"
            >
              <IconWhatsApp className="size-5 text-[#158a43]" /> WhatsApp
            </a>
          </div>

          <h1 className="mt-8 max-w-2xl font-display text-[2.6rem] leading-[1.02] sm:text-6xl">
            Mirá qué tenemos <span className="text-sun">antes de venir</span>
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/90 sm:text-lg">
            Precios y stock al día. Buscá lo que necesitás y, si no lo ves, escribinos.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink/90 px-3.5 py-1.5">
              <span className={`size-2.5 rounded-full ${estado ? (estado.abierto ? "bg-[#39e08b]" : "bg-[#ff8aa8]") : "bg-white/40"}`} />
              {estado ? estado.texto : "Horarios"}
            </span>
            <a href="#ubicacion" className="inline-flex items-center gap-1.5 underline decoration-white/50 underline-offset-4 hover:decoration-white">
              <IconPin className="size-4" /> {NEGOCIO.direccion}
            </a>
          </div>
        </div>
      </header>

      {/* ───────── Buscador y categorías (se queda fijo al scrollear) ───────── */}
      <div className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 pb-2.5 pt-3 sm:px-6">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <input
              id="search-input"
              type="search"
              inputMode="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué estás buscando? Ej: globos, velas, piñata…"
              aria-label="Buscar productos por nombre o código"
              className="w-full rounded-xl border-2 border-ink bg-white py-3 pl-12 pr-11 text-base outline-none transition placeholder:text-muted/80 focus:border-pink focus:ring-4 focus:ring-pink/15 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Borrar búsqueda"
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-line hover:text-ink"
              >
                <IconClose className="size-4" />
              </button>
            )}
          </div>

          <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Categorías">
            {[["Todas", matching.length], ...categories].map(([c, n]) => (
              <button
                key={c}
                role="tab"
                aria-selected={category === c}
                disabled={n === 0 && category !== c}
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  category === c
                    ? "border-ink bg-ink text-white"
                    : "border-ink/30 bg-white text-ink hover:border-ink"
                }`}
              >
                {c} <span className={`tabular ${category === c ? "text-sun" : "text-muted"}`}>{n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ───────── Listado ───────── */}
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="text-sm font-semibold text-muted" aria-live="polite">
            {products ? `${visible.length} ${visible.length === 1 ? "producto" : "productos"}` : "Cargando productos…"}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2 font-semibold">
              <input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} className="size-4 accent-[#e5246f]" />
              Solo lo que hay en stock
            </label>
            <label className="flex items-center gap-2 font-semibold">
              Ordenar
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border-2 border-ink/30 bg-white px-2 py-1.5 font-semibold outline-none focus:border-pink"
              >
                <option value="categoria">Por categoría</option>
                <option value="asc">Menor precio</option>
                <option value="desc">Mayor precio</option>
              </select>
            </label>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border-2 border-ink bg-white p-6 text-center font-semibold">
            No pudimos cargar el catálogo.{" "}
            <button onClick={load} className="text-pink-deep underline">Reintentar</button>
          </div>
        )}

        {!products && !error && (
          <ul aria-busy="true" className="mt-5 overflow-hidden rounded-2xl border-2 border-ink bg-white">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-[#e9e0f3] bg-white px-4 py-3">
                <div className="skeleton size-16 rounded-lg" />
                <div className="flex-1 space-y-2"><div className="skeleton h-4 w-2/3 rounded" /><div className="skeleton h-5 w-1/3 rounded" /></div>
              </li>
            ))}
          </ul>
        )}

        {products && visible.length === 0 && (
          <div className="mx-auto mt-5 max-w-md rounded-2xl border-2 border-ink bg-white px-6 py-12 text-center">
            <h2 className="font-display text-3xl">No lo encontramos en el catálogo</h2>
            <p className="mt-2 text-muted">
              {query ? <>Puede que lo tengamos igual. Preguntanos por <strong className="text-ink">&ldquo;{query}&rdquo;</strong>.</> : "Probá con otros filtros."}
            </p>
            <div className="mt-5 flex flex-col items-center gap-3">
              {query && (
                <a
                  href={waLink(`Hola! Busco "${query}", ¿lo tienen?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-wa px-5 py-3 font-bold text-white transition hover:bg-wa-dark"
                >
                  <IconWhatsApp className="size-5" /> Preguntar por WhatsApp
                </a>
              )}
              {hasFilters && <button onClick={reset} className="text-sm font-bold text-pink-deep underline">Limpiar filtros</button>}
            </div>
          </div>
        )}

        {groups.map(([name, items]) => (
          <section key={name ?? "todos"} aria-label={name ?? "Productos"} className="mt-5 overflow-hidden rounded-2xl border-2 border-ink bg-white px-4 pb-1 pt-4 sm:px-6">
            {name && (
              <h2 className="flex items-baseline gap-3 border-b-4 border-pink pb-1 font-display text-2xl sm:text-3xl">
                {name}
                <span className="tabular font-sans text-sm font-bold text-muted">{items.length}</span>
              </h2>
            )}
            <ul className="md:grid md:grid-cols-2 md:gap-x-10">
              {items.map((p) => (
                <ProductRow key={p.id} product={p} onOpen={setSelected} />
              ))}
            </ul>
          </section>
        ))}
      </main>

      <StoreInfo />

      <footer className="bg-ink px-4 pb-8 pt-2 text-center text-xs text-[#bfb0d8]">
        <p>
          {NEGOCIO.nombre} · {NEGOCIO.direccion} ·{" "}
          <a href={mapsLink()} target="_blank" rel="noopener noreferrer" className="underline hover:text-sun">Ver mapa</a>
        </p>
        <p className="mt-1">Los precios y la disponibilidad pueden cambiar sin previo aviso.</p>
      </footer>

      {/* Botón flotante de WhatsApp siempre a mano */}
      <a
        href={waLink("Hola! Quería hacer una consulta.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribinos por WhatsApp"
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-wa px-4 py-3 font-bold text-white shadow-[0_8px_20px_-6px_rgba(21,138,67,.7)] transition hover:bg-wa-dark active:scale-95 sm:hidden"
      >
        <IconWhatsApp className="size-6" /> WhatsApp
      </a>

      <ProductModal product={selected} onClose={closeModal} />
    </>
  );
}
