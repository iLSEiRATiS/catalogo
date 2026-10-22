import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function secretKey() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET no configurado (mínimo 16 caracteres).");
  }
  return new TextEncoder().encode(s);
}

/** Crea la cookie de sesión (httpOnly, firmada con HS256). */
export async function createSession(user) {
  const token = await new SignJWT({ uid: user.id, username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Devuelve el payload de la sesión o null si no hay sesión válida. */
export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload;
  } catch {
    return null;
  }
}
