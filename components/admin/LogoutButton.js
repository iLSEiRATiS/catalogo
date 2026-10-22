"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-600 ring-1 ring-stone-200 transition hover:bg-stone-100">
      Salir
    </button>
  );
}
