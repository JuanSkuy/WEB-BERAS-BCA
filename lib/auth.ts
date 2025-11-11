import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const secret = process.env.AUTH_SECRET;
if (!secret) {
  throw new Error("Missing AUTH_SECRET env var");
}
const secretKey = secret as string;

export type SessionPayload = { userId: string; email: string };

export async function createSession(payload: SessionPayload, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const token = jwt.sign(payload, secretKey, {
    expiresIn: maxAgeSeconds,
  });

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;
    const payload = jwt.verify(token, secretKey) as SessionPayload;
    return { userId: String(payload.userId), email: String(payload.email) };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { httpOnly: true, path: "/", maxAge: 0 });
}


