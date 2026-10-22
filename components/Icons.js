// Íconos dibujados a mano (trazo uniforme de 2px) para todo el sitio público.
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const IconSearch = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const IconPin = (p) => (
  <svg {...base} {...p}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21Z" /><circle cx="12" cy="9.500" r="2.500" /></svg>
);
export const IconClock = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconWhatsApp = (p) => (
  <svg {...base} {...p}>
    <path d="M20 11.500a8 8 0 0 1-11.800 7L4 19.500l1.100-4A8 8 0 1 1 20 11.500Z" />
    <path d="M9 9.500c0 3 2.500 5.500 5.500 5.500l1-1.300-2-1-.8.800c-.9-.4-1.700-1.200-2.100-2.100l.8-.8-1-2L9 9.500Z" />
  </svg>
);
export const IconClose = (p) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconPhone = (p) => (
  <svg {...base} {...p}><path d="M5 4h3l2 5-2.500 1.500a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
);
export const IconInstagram = (p) => (
  <svg {...base} {...p}><rect x="3.500" y="3.500" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r=".6" fill="currentColor" /></svg>
);
export const IconArrow = (p) => (
  <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
