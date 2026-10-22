"use client";

import { useEffect, useState } from "react";
import { DIAS, NEGOCIO, ahoraEnLocal, mapsEmbed, mapsLink, textoHorario, waLink } from "@/lib/negocio";
import { IconArrow, IconClock, IconInstagram, IconPhone, IconPin, IconWhatsApp } from "./Icons";

/** Dónde estamos: dirección, horarios (hoy resaltado), mapa y contacto. */
export default function StoreInfo() {
  // El día actual se calcula en el cliente para no desfasar la hidratación.
  const [hoy, setHoy] = useState(null);
  useEffect(() => {
    const id = setTimeout(() => setHoy(ahoraEnLocal().dia), 0);
    return () => clearTimeout(id);
  }, []);

  const orden = [1, 2, 3, 4, 5, 6, 0]; // semana de lunes a domingo

  return (
    <section id="ubicacion" className="bg-ink text-white" aria-labelledby="ubicacion-titulo">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 md:gap-12 md:py-16">
        <div>
          <h2 id="ubicacion-titulo" className="font-display text-4xl leading-none sm:text-5xl">
            Pasá por el local
          </h2>
          <p className="mt-3 max-w-md text-[#d9cdee]">
            Si ya viste lo que buscás, vení directo: ahorrás tiempo y lo tenemos separado.
          </p>

          <address className="mt-6 flex items-start gap-3 not-italic">
            <IconPin className="mt-0.5 size-6 shrink-0 text-sun" />
            <span>
              <span className="block text-lg font-bold">{NEGOCIO.direccion}</span>
              {NEGOCIO.referencia && <span className="text-sm text-[#d9cdee]">{NEGOCIO.referencia}</span>}
            </span>
          </address>

          <div className="mt-6 flex items-start gap-3">
            <IconClock className="mt-1 size-6 shrink-0 text-sun" />
            <table className="w-full max-w-sm text-sm">
              <caption className="sr-only">Horarios de atención</caption>
              <tbody>
                {orden.map((d) => (
                  <tr key={d} className={d === hoy ? "font-extrabold text-sun" : "text-[#e8defa]"}>
                    <th scope="row" className="py-1 pr-4 text-left font-[inherit]">{DIAS[d]}</th>
                    <td className="tabular py-1">{textoHorario(d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={waLink("Hola! Quería hacer una consulta.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-wa px-5 py-3 font-bold text-white transition hover:bg-wa-dark"
            >
              <IconWhatsApp className="size-5" /> Escribinos por WhatsApp
            </a>
            <a
              href={mapsLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-sun px-5 py-3 font-bold text-ink transition hover:brightness-95"
            >
              Cómo llegar <IconArrow className="size-5" />
            </a>
          </div>

          <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#d9cdee]">
            {NEGOCIO.telefonoVisible && (
              <span className="inline-flex items-center gap-1.5"><IconPhone className="size-4" /> {NEGOCIO.telefonoVisible}</span>
            )}
            {NEGOCIO.instagram && (
              <a href={`https://instagram.com/${NEGOCIO.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-sun">
                <IconInstagram className="size-4" /> @{NEGOCIO.instagram}
              </a>
            )}
          </p>
        </div>

        <div className="min-h-[300px] overflow-hidden rounded-2xl bg-[#3a2461] ring-4 ring-sun md:min-h-[420px]">
          <iframe
            title={`Mapa de ${NEGOCIO.nombre}`}
            src={mapsEmbed()}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="size-full min-h-[300px] border-0 md:min-h-[420px]"
          />
        </div>
      </div>
    </section>
  );
}
