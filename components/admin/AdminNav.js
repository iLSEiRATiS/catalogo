"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Resumen e importación" },
  { href: "/admin/productos", label: "Productos" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1" aria-label="Secciones">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            pathname === l.href ? "bg-brand-soft text-brand" : "text-stone-500 hover:text-ink"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
