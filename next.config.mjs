/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite abrir el entorno de desarrollo desde otros dispositivos de la red (ej. el celular).
  allowedDevOrigins: ["192.168.0.102"],

  // better-sqlite3 es un módulo nativo: debe quedar fuera del bundle.
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
