import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

// Límite básico anti fuerza bruta: 8 intentos fallidos / 10 min por IP (en memoria).
const attempts = (globalThis.__loginAttempts ??= new Map());
const WINDOW = 10 * 60 * 1000;
const MAX = 8;

// Hash falso para igualar tiempos cuando el usuario no existe.
const DUMMY = bcrypt.hashSync("dummy-password", 12);

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && now - rec.first < WINDOW && rec.count >= MAX) {
    return NextResponse.json({ error: "Demasiados intentos. Probá en unos minutos." }, { status: 429 });
  }

  const { username, password } = await req.json().catch(() => ({}));
  const user = db.prepare("SELECT * FROM usuarios WHERE username = ?").get(String(username ?? ""));
  const ok = await bcrypt.compare(String(password ?? ""), user?.password_hash ?? DUMMY);

  if (!user || !ok) {
    attempts.set(ip, !rec || now - rec.first >= WINDOW ? { first: now, count: 1 } : { ...rec, count: rec.count + 1 });
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  attempts.delete(ip);
  await createSession(user);
  return NextResponse.json({ ok: true });
}
