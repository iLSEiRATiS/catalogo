/**
 * DATOS DEL NEGOCIO — editá solo este archivo para personalizar el catálogo.
 * (Nombre, dirección, WhatsApp, horarios y mapa se actualizan en todo el sitio.)
 */
export const NEGOCIO = {
  nombre: "Cotillón La Piñata",
  // Texto corto bajo el nombre
  eslogan: "Cotillón y artículos para tu fiesta",

  // Dirección tal cual se escribe en Google Maps (se usa para el mapa y el botón "Cómo llegar")
  direccion: "Av. Corrientes 1234, Buenos Aires",
  referencia: "Entre Uruguay y Talcahuano", // opcional ("" para ocultar)

  // WhatsApp en formato internacional, sin "+" ni espacios. Argentina móvil: 549 + área + número
  whatsapp: "5491112345678",
  telefonoVisible: "11 1234-5678", // cómo se muestra en pantalla
  instagram: "", // ej: "cotillonlapinata" (vacío para ocultar)

  zonaHoraria: "America/Argentina/Buenos_Aires",

  // Horarios por día: 0 = domingo ... 6 = sábado. Cada tramo es ["desde", "hasta"]. [] = cerrado.
  horarios: {
    1: [["09:00", "13:00"], ["16:00", "20:00"]],
    2: [["09:00", "13:00"], ["16:00", "20:00"]],
    3: [["09:00", "13:00"], ["16:00", "20:00"]],
    4: [["09:00", "13:00"], ["16:00", "20:00"]],
    5: [["09:00", "13:00"], ["16:00", "20:00"]],
    6: [["09:00", "14:00"]],
    0: [],
  },
};

export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Día de la semana (0-6) y minutos desde medianoche en la zona horaria del local. */
export function ahoraEnLocal(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: NEGOCIO.zonaHoraria,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { dia, minutos: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** { abierto: boolean, texto: string } — ej. "Abierto hasta las 20:00" / "Cerrado · abre mañana 09:00" */
export function estadoAhora(date = new Date()) {
  const { dia, minutos } = ahoraEnLocal(date);
  const hoy = NEGOCIO.horarios[dia] ?? [];

  for (const [d, h] of hoy) {
    if (minutos >= toMin(d) && minutos < toMin(h)) return { abierto: true, texto: `Abierto hasta las ${h}` };
  }
  const siguienteHoy = hoy.find(([d]) => toMin(d) > minutos);
  if (siguienteHoy) return { abierto: false, texto: `Cerrado · abre hoy a las ${siguienteHoy[0]}` };

  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7;
    const tramos = NEGOCIO.horarios[d] ?? [];
    if (tramos.length) {
      const cuando = i === 1 ? "mañana" : `el ${DIAS[d].toLowerCase()}`;
      return { abierto: false, texto: `Cerrado · abre ${cuando} a las ${tramos[0][0]}` };
    }
  }
  return { abierto: false, texto: "Cerrado" };
}

/** Texto de un día: "09:00 a 13:00 y 16:00 a 20:00" o "Cerrado" */
export function textoHorario(dia) {
  const t = NEGOCIO.horarios[dia] ?? [];
  return t.length ? t.map(([d, h]) => `${d} a ${h}`).join(" y ") : "Cerrado";
}

export const mapsLink = () =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(NEGOCIO.direccion)}`;
export const mapsEmbed = () =>
  `https://www.google.com/maps?q=${encodeURIComponent(NEGOCIO.direccion)}&output=embed`;

export const waLink = (texto) => `https://wa.me/${NEGOCIO.whatsapp}?text=${encodeURIComponent(texto)}`;
