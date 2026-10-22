import { Lilita_One, Figtree } from "next/font/google";
import "./globals.css";
import { NEGOCIO } from "@/lib/negocio";

const lilita = Lilita_One({ variable: "--font-lilita", subsets: ["latin"], weight: "400" });
const figtree = Figtree({ variable: "--font-body", subsets: ["latin"] });

export const metadata = {
  title: `${NEGOCIO.nombre} · Catálogo de productos y precios`,
  description: `Mirá los productos, precios y stock de ${NEGOCIO.nombre} antes de venir. ${NEGOCIO.direccion}.`,
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#e5246f" };

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${lilita.variable} ${figtree.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
