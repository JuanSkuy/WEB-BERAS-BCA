import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { email, password } = await req.json();
    const debug = req.nextUrl.searchParams.get("debug") === "1";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const result = await sql`select id, email, password_hash from users where lower(trim(email)) = ${normalizedEmail} limit 1`;
    const user = (result as any)[0];
    if (!user) {
      if (debug) {
        return NextResponse.json({ debug: { normalizedEmail, userFound: false } }, { status: 200 });
      }
      return NextResponse.json({ error: "Invalid credentials: user not found" }, { status: 401 });
    }

    const supplied = String(password);
    let storedHash = String(user.password_hash || "").trim();
    // Normalize legacy bcrypt prefix if present
    if (storedHash.startsWith("$2y$")) {
      storedHash = storedHash.replace("$2y$", "$2b$");
    }
    let ok = await bcrypt.compare(supplied, storedHash);
    if (!ok) {
      const trimmed = supplied.trim();
      if (trimmed !== supplied) {
        ok = await bcrypt.compare(trimmed, storedHash);
      }
      if (!ok) {
        try {
          ok = bcrypt.compareSync(supplied, storedHash);
        } catch {}
      }
    }
    if (!ok) {
      if (debug) {
        return NextResponse.json({ debug: { normalizedEmail, userFound: true, compareOk: false } }, { status: 200 });
      }
      return NextResponse.json({ error: "Invalid credentials: wrong password" }, { status: 401 });
    }

    await createSession({ userId: String(user.id), email: String(user.email) });
    if (debug) {
      return NextResponse.json({ debug: { normalizedEmail, userFound: true, compareOk: true } });
    }
    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}


