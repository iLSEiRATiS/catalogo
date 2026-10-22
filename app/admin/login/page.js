"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }),
    });
    if (res.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo iniciar sesión.");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-brand px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm animate-pop space-y-5 rounded-3xl bg-white p-8 shadow-2xl"
      >
        <div>
          <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand text-xl font-extrabold text-white">A</div>
          <h1 className="text-2xl font-extrabold tracking-tight">Panel de administración</h1>
          <p className="mt-1 text-sm text-stone-500">Ingresá para gestionar tu catálogo.</p>
        </div>

        <label className="block text-sm font-semibold">
          Usuario
          <input name="username" required autoComplete="username" autoFocus
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" />
        </label>
        <label className="block text-sm font-semibold">
          Contraseña
          <input name="password" type="password" required autoComplete="current-password"
            className="mt-1.5 w-full rounded-xl border border-stone-200 px-4 py-2.5 font-normal outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" />
        </label>

        {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">{error}</p>}

        <button disabled={loading}
          className="w-full rounded-xl bg-brand py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
