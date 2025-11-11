import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { email, new_password } = await req.json();
    if (!email || !new_password) {
      return NextResponse.json({ error: "email and new_password required" }, { status: 400 });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const hash = await bcrypt.hash(String(new_password), 10);

    const res = await sql`update users set password_hash = ${hash} where lower(trim(email)) = ${normalizedEmail} returning id, email`;
    const user = (res as any).rows?.[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}


