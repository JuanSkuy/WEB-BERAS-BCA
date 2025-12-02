import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const result = await sql`
      select id, email, password_hash, role 
      from users 
      where lower(trim(email)) = ${normalizedEmail} and role = 'admin'
      limit 1
    `;
    const user = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    let storedHash = String(user.password_hash || "").trim();
    if (storedHash.startsWith("$2y$")) {
      storedHash = storedHash.replace("$2y$", "$2b$");
    }
    
    const ok = await bcrypt.compare(String(password), storedHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession({ userId: String(user.id), email: String(user.email) });
    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

