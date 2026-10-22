import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

/** Carpeta de datos persistentes (base SQLite + imágenes subidas). */
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

function init() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const db = new Database(path.join(DATA_DIR, "catalogo.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      sku                 TEXT    NOT NULL UNIQUE,
      nombre              TEXT    NOT NULL,
      descripcion         TEXT    NOT NULL DEFAULT '',
      categoria           TEXT    NOT NULL DEFAULT 'General',
      precio              REAL    NOT NULL DEFAULT 0 CHECK (precio >= 0),
      stock               INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      imagen              TEXT    NOT NULL DEFAULT '',
      fecha_actualizacion TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (categoria);

    CREATE TABLE IF NOT EXISTS usuarios (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `);

  // Admin inicial: solo si todavía no existe ningún usuario.
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM usuarios").get();
  if (n === 0) {
    const user = process.env.ADMIN_USER || "admin";
    const pass = process.env.ADMIN_PASSWORD || "admin1234";
    db.prepare("INSERT OR IGNORE INTO usuarios (username, password_hash) VALUES (?, ?)").run(
      user,
      bcrypt.hashSync(pass, 12)
    );
    console.log(`[db] Usuario admin inicial creado: "${user}"`);
  }

  return db;
}

// Se reutiliza la conexión entre recargas en desarrollo (HMR).
export const db = (globalThis.__catalogoDb ??= init());
