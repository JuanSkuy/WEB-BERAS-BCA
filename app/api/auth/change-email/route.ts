import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { new_email, password } = await req.json();

    if (!new_email || !password) {
      return NextResponse.json(
        { error: "new_email and password required" },
        { status: 400 }
      );
    }

    const normalizedNewEmail = String(new_email).toLowerCase().trim();

    // Verify password
    const userRes = await sql`
      SELECT password_hash FROM users WHERE id = ${session.userId}
    `;
    const users = (userRes as any).rows || userRes;
    const user = Array.isArray(users) ? users[0] : users?.[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordValid = await bcrypt.compare(String(password), user.password_hash);
    if (!passwordValid) {
      return NextResponse.json({ error: "Password incorrect" }, { status: 401 });
    }

    // Check if new email already exists
    const existingEmail = await sql`
      SELECT id FROM users WHERE lower(trim(email)) = ${normalizedNewEmail}
    `;
    const existing = (existingEmail as any).rows || existingEmail;
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Update email
    const updateRes = await sql`
      UPDATE users 
      SET email = ${normalizedNewEmail} 
      WHERE id = ${session.userId} 
      RETURNING id, email
    `;
    const updated = (updateRes as any).rows?.[0] || updateRes;

    return NextResponse.json({
      ok: true,
      message: "Email updated successfully",
      user: { id: updated.id, email: updated.email },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
