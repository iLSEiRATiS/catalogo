import { getStats } from "@/lib/products";
import Importer from "@/components/admin/Importer";

function Stat({ label, value, tone }) {
  const tones = {
    neutral: "bg-white text-ink",
    ok: "bg-emerald-50 text-emerald-900",
    bad: "bg-rose-50 text-rose-900",
  };
  return (
    <div className={`rounded-2xl p-5 ring-1 ring-stone-200/70 ${tones[tone]}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="mt-1 text-4xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const stats = getStats();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Resumen</h1>
        <p className="mt-1 text-stone-500">Estado actual de tu catálogo.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Estadísticas">
        <Stat label="Total de productos" value={stats.total} tone="neutral" />
        <Stat label="Con stock" value={stats.con_stock} tone="ok" />
        <Stat label="Sin stock" value={stats.sin_stock} tone="bad" />
      </section>

      <Importer />
    </div>
  );
}
