import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const passwordHash = await bcrypt.hash(String(password), 10);

    const existing = await sql`select id from users where email = ${normalizedEmail} limit 1`;
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const newId = randomUUID();
    await sql`
      insert into users (id, email, password_hash)
      values (${newId}, ${normalizedEmail}, ${passwordHash})
    `;

    await createSession({ userId: String(newId), email: String(normalizedEmail) });
    return NextResponse.json({ user: { id: newId, email: normalizedEmail } }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}


