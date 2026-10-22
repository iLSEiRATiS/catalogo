"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ACCEPT = ".csv,.xlsx,.xls";

/** Área Drag & Drop para importar CSV/Excel y mostrar el resultado del upsert. */
export default function Importer() {
  const router = useRouter();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function upload(file) {
    if (!file) return;
    setError("");
    setResult(null);
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setError("Formato no soportado. Subí un archivo .csv o .xlsx");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      setResult(data);
      router.refresh(); // actualiza las tarjetas de estadísticas
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-stone-200/70 sm:p-7" aria-labelledby="import-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="import-title" className="text-xl font-bold">Importación masiva</h2>
          <p className="mt-1 max-w-xl text-sm text-stone-500">
            Subí un CSV o Excel con las columnas <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">sku, nombre, descripcion, categoria, precio, stock, imagen_url</code>.
            Si el SKU ya existe se actualiza; si no, se crea. Las celdas vacías no pisan datos existentes.
          </p>
        </div>
        <a
          href="/plantilla_productos.csv"
          download
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-brand ring-1 ring-brand/30 transition hover:bg-brand-soft"
        >
          ⬇ Descargar plantilla CSV
        </a>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files?.[0]); }}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Zona para soltar el archivo de importación"
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
          dragging ? "scale-[1.01] border-brand bg-brand-soft" : "border-stone-300 bg-stone-50 hover:border-brand/60 hover:bg-brand-soft/50"
        }`}
      >
        <input ref={inputRef} type="file" accept={ACCEPT} hidden id="import-file" onChange={(e) => upload(e.target.files?.[0])} />
        <div className="text-4xl">{busy ? "⏳" : "📄"}</div>
        <p className="font-semibold">{busy ? "Procesando archivo…" : "Arrastrá tu archivo acá o hacé clic para elegirlo"}</p>
        <p className="text-xs text-stone-500">.csv · .xlsx — hasta 5 MB</p>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}

      {result && (
        <div className="mt-5 animate-fade-up space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 p-4 text-emerald-900"><p className="text-3xl font-extrabold">{result.creados}</p><p className="text-sm">Productos creados</p></div>
            <div className="rounded-xl bg-sky-50 p-4 text-sky-900"><p className="text-3xl font-extrabold">{result.actualizados}</p><p className="text-sm">Productos actualizados</p></div>
            <div className={`rounded-xl p-4 ${result.errores.length ? "bg-rose-50 text-rose-900" : "bg-stone-100 text-stone-700"}`}><p className="text-3xl font-extrabold">{result.errores.length}</p><p className="text-sm">Filas con error</p></div>
          </div>
          {result.errores.length > 0 && (
            <div className="max-h-56 overflow-auto rounded-xl ring-1 ring-rose-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-rose-50 text-rose-900"><tr><th className="px-3 py-2">Fila</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2">Motivo</th></tr></thead>
                <tbody>
                  {result.errores.map((e, i) => (
                    <tr key={i} className="border-t border-rose-100"><td className="px-3 py-1.5">{e.fila}</td><td className="px-3 py-1.5 font-mono text-xs">{e.sku || "—"}</td><td className="px-3 py-1.5">{e.error}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
