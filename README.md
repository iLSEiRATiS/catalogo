# Catálogo informativo de productos

Next.js (App Router) + Tailwind CSS v4 + SQLite (better-sqlite3). Sin carrito ni pagos: solo precio, stock y consulta por WhatsApp.

## Puesta en marcha

```bash
npm install
# editar .env.local (JWT_SECRET, ADMIN_USER/ADMIN_PASSWORD, NEXT_PUBLIC_WHATSAPP_NUMBER, NEXT_PUBLIC_BUSINESS_NAME)
npm run dev          # http://localhost:3000   (admin: /admin)
```

Producción: `npm run build && npm start`. Los datos viven en `./data` (base `catalogo.db` + `uploads/`): **respaldá esa carpeta**.
El admin inicial se crea al primer arranque con `ADMIN_USER` / `ADMIN_PASSWORD`. Cambiá ambos antes de publicar.

## Estructura

```
app/
  page.js                      Catálogo público
  admin/login/page.js          Login
  admin/(panel)/               Rutas protegidas (layout valida sesión)
    page.js                    Resumen + importación CSV/Excel
    productos/page.js          Tabla de edición rápida
  api/products                 GET público
  api/img/[name]               Sirve imágenes subidas
  api/auth/{login,logout}
  api/admin/{products,products/[id],import,images}   Requieren sesión
components/                    Catalog, ProductCard, ProductModal
components/admin/              Importer, ProductsManager, AdminNav, LogoutButton
lib/                           db, auth, products, importer, images, format
public/plantilla_productos.csv Plantilla descargable
ejemplos/productos_prueba.csv  5 productos de prueba
```

## Importación

Columnas: `sku, nombre, descripcion, categoria, precio, stock, imagen_url`.
CSV (coma o punto y coma, UTF-8/ANSI) con PapaParse y Excel `.xlsx` con SheetJS. Upsert por `sku`; celdas vacías no pisan datos existentes.
Precios aceptados: `1234.5`, `1.234,50`, `$ 1,234.50`. Stock: número o `si/no/disponible/agotado`.

## Imágenes

- Por fila: clic en la miniatura de la tabla.
- Masivo: "Subir imágenes por SKU" (el archivo debe llamarse como el SKU, ej. `REM-001.jpg`).
- O usar una URL en `imagen_url`.
