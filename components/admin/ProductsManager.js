"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatPrice, imageSrc, normalize } from "@/lib/format";

/** Llamada JSON con manejo de error unificado. */
async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ocurrió un error");
  return data;
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-stone-300"}`}
    >
      <span className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

/** Precio editable en línea: se guarda al salir del campo o con Enter. */
function PriceInput({ value, onSave }) {
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const n = Number(draft.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return setDraft(String(value));
    if (n !== value) onSave(n);
  };
  return (
    <div className="relative w-32">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">$</span>
      <input
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        aria-label="Precio"
        className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-7 pr-2 text-sm font-semibold outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
      />
    </div>
  );
}

const EMPTY = { sku: "", nombre: "", descripcion: "", categoria: "", precio: "", stock: "0", imagen: "" };

/** Modal de alta / edición completa. */
function ProductForm({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState(product ? { ...product, precio: String(product.precio), stock: String(product.stock) } : EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, precio: form.precio, stock: form.stock };
      const saved = product
        ? await api(`/api/admin/products/${product.id}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await api("/api/admin/products", { method: "POST", body: JSON.stringify(payload) });
      onSaved(saved, !product);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const field = "mt-1 w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/60 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="grid max-h-[92vh] w-full max-w-xl animate-pop gap-4 overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <h2 className="text-xl font-bold">{product ? "Editar producto" : "Nuevo producto"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">SKU *<input required value={form.sku} onChange={set("sku")} className={field} /></label>
          <label className="text-sm font-semibold">Categoría
            <input list="cat-list" value={form.categoria} onChange={set("categoria")} placeholder="General" className={field} />
            <datalist id="cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
        </div>
        <label className="text-sm font-semibold">Nombre *<input required value={form.nombre} onChange={set("nombre")} className={field} /></label>
        <label className="text-sm font-semibold">Descripción<textarea rows={3} value={form.descripcion} onChange={set("descripcion")} className={field} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Precio (ARS) *<input required type="number" min="0" step="0.01" value={form.precio} onChange={set("precio")} className={field} /></label>
          <label className="text-sm font-semibold">Stock (unidades)<input type="number" min="0" step="1" value={form.stock} onChange={set("stock")} className={field} /></label>
        </div>
        <label className="text-sm font-semibold">Imagen (URL externa, opcional)
          <input value={form.imagen} onChange={set("imagen")} placeholder="https://… (o subí un archivo desde la tabla)" className={field} />
        </label>
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-stone-200 hover:bg-stone-50">Cancelar</button>
          <button disabled={saving} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">{saving ? "Guardando…" : "Guardar"}</button>
        </div>
      </form>
    </div>
  );
}

/** Tabla CRUD con edición rápida de precio, toggle de stock e imágenes. */
export default function ProductsManager() {
  const [products, setProducts] = useState(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(undefined); // undefined=cerrado, null=nuevo, obj=editar
  const [toast, setToast] = useState(null);
  const rowFileRef = useRef(null);
  const rowTarget = useRef(null);
  const bulkRef = useRef(null);

  const notify = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    api("/api/products", { cache: "no-store" }).then(setProducts).catch((e) => notify(e.message, "error"));
  }, [notify]);

  const replace = (saved) => setProducts((list) => list.map((p) => (p.id === saved.id ? saved : p)));

  const filtered = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return (products ?? []).filter((p) => {
      const h = normalize(`${p.nombre} ${p.sku} ${p.categoria}`);
      return terms.every((t) => h.includes(t));
    });
  }, [products, query]);

  const categories = useMemo(() => [...new Set((products ?? []).map((p) => p.categoria))], [products]);

  async function patch(p, data, okMsg) {
    try {
      replace(await api(`/api/admin/products/${p.id}`, { method: "PATCH", body: JSON.stringify(data) }));
      notify(okMsg);
    } catch (e) {
      notify(e.message, "error");
    }
  }

  async function remove(p) {
    if (!confirm(`¿Eliminar "${p.nombre}" (${p.sku})? Esta acción no se puede deshacer.`)) return;
    try {
      await api(`/api/admin/products/${p.id}`, { method: "DELETE" });
      setProducts((l) => l.filter((x) => x.id !== p.id));
      notify("Producto eliminado");
    } catch (e) {
      notify(e.message, "error");
    }
  }

  /** Sube imágenes. Con `product` se asocia a esa fila; sin él se vincula por nombre de archivo = SKU. */
  async function uploadImages(files, product) {
    if (!files?.length) return;
    const fd = new FormData();
    [...files].forEach((f) => fd.append("files", f));
    if (product) fd.append("productId", product.id);
    try {
      const r = await api("/api/admin/images", { method: "POST", body: fd });
      setProducts(await api("/api/products", { cache: "no-store" }));
      if (r.errores.length) notify(`${r.vinculadas} vinculadas. Errores: ${r.errores.map((e) => `${e.archivo} (${e.error})`).join("; ")}`, "error");
      else notify(`${r.vinculadas} imagen(es) vinculada(s)`);
    } catch (e) {
      notify(e.message, "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Productos</h1>
          <p className="mt-1 text-stone-500">Editá precio y disponibilidad con un clic.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => bulkRef.current?.click()} className="rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-stone-300 transition hover:bg-white" title="El nombre de cada archivo debe ser el SKU. Ej: REM-001.jpg">
            🖼 Subir imágenes por SKU
          </button>
          <button onClick={() => setEditing(null)} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
            + Nuevo producto
          </button>
        </div>
      </div>

      {/* Inputs de archivo ocultos */}
      <input ref={bulkRef} type="file" accept="image/*" multiple hidden onChange={(e) => { uploadImages(e.target.files); e.target.value = ""; }} />
      <input ref={rowFileRef} type="file" accept="image/*" hidden onChange={(e) => { uploadImages(e.target.files, rowTarget.current); e.target.value = ""; }} />

      <input
        id="admin-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre, SKU o categoría…"
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 sm:max-w-md"
      />

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-stone-200/70">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Imagen</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {!products && <tr><td colSpan={5} className="px-4 py-10 text-center text-stone-400">Cargando…</td></tr>}
            {products && filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-stone-400">Sin resultados.</td></tr>}
            {filtered.map((p) => (
              <tr key={p.id} className="transition hover:bg-stone-50/70">
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => { rowTarget.current = p; rowFileRef.current?.click(); }}
                    title="Cambiar imagen"
                    className="group relative block size-14 overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageSrc(p)} alt="" onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }} className="size-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center bg-stone-950/55 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">Cambiar</span>
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <p className="font-semibold">{p.nombre}</p>
                  <p className="text-xs text-stone-500"><span className="font-mono">{p.sku}</span> · {p.categoria}</p>
                </td>
                <td className="px-4 py-2.5">
                  <PriceInput key={p.precio} value={p.precio} onSave={(n) => patch(p, { precio: n }, `Precio actualizado: ${formatPrice(n)}`)} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={p.stock > 0}
                      label={`Stock de ${p.nombre}`}
                      // Activar sin cantidad previa = 1 unidad; la cantidad exacta se edita en el formulario.
                      onChange={() => patch(p, { stock: p.stock > 0 ? 0 : 1 }, p.stock > 0 ? "Marcado sin stock" : "Marcado en stock")}
                    />
                    <span className={`text-xs font-semibold ${p.stock > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                      {p.stock > 0 ? `En stock (${p.stock})` : "Sin stock"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => setEditing(p)} className="rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-stone-200 hover:bg-stone-100">Editar</button>
                    <button onClick={() => remove(p)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => setEditing(undefined)}
          onSaved={(saved, isNew) => {
            setProducts((l) => (isNew ? [saved, ...l] : l.map((p) => (p.id === saved.id ? saved : p))));
            setEditing(undefined);
            notify(isNew ? "Producto creado" : "Producto actualizado");
          }}
        />
      )}

      {toast && (
        <div role="status" className={`fixed bottom-5 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 animate-pop rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${toast.type === "error" ? "bg-rose-600" : "bg-stone-900"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
