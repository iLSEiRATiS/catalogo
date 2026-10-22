import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/admin/LogoutButton";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: "Administración · Catálogo", robots: { index: false, follow: false } };

// Protege TODAS las páginas del panel: sin sesión válida -> /admin/login.
export default async function PanelLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#f1edf7]">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5 font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">A</span>
            <span className="hidden sm:inline">Administración</span>
          </Link>
          <AdminNav />
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" target="_blank" className="hidden text-sm font-medium text-stone-500 hover:text-ink sm:inline">
              Ver catálogo ↗
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
