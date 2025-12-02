import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

// Endpoint untuk membuat admin pertama (hanya untuk development/setup awal)
// Hapus atau proteksi endpoint ini di production!
export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    
    // Check if user already exists
    const existing = await sql`
      select id from users where email = ${normalizedEmail} limit 1
    `;
    const existingUser = Array.isArray(existing) ? existing[0] : (existing as any).rows?.[0];
    
    if (existingUser) {
      // Update existing user to admin
      const passwordHash = await bcrypt.hash(String(password), 10);
      await sql`
        update users 
        set password_hash = ${passwordHash}, role = 'admin'
        where id = ${existingUser.id}
      `;
      return NextResponse.json({ 
        message: "User updated to admin",
        user: { id: existingUser.id, email: normalizedEmail, role: "admin" }
      });
    }

    // Create new admin user
    const newId = randomUUID();
    const passwordHash = await bcrypt.hash(String(password), 10);
    
    await sql`
      insert into users (id, email, password_hash, role)
      values (${newId}, ${normalizedEmail}, ${passwordHash}, 'admin')
    `;

    return NextResponse.json({ 
      message: "Admin user created",
      user: { id: newId, email: normalizedEmail, role: "admin" }
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

