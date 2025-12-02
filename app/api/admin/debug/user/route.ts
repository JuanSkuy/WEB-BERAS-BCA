import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-init";

export const runtime = "nodejs";

// Endpoint untuk debug - cek user dan role
export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    
    // Cek user dengan semua detail
    const result = await sql`
      select id, email, name, role, created_at, password_hash
      from users 
      where lower(trim(email)) = ${normalizedEmail}
      limit 1
    `;
    const user = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    
    if (!user) {
      return NextResponse.json({ 
        found: false,
        message: "User tidak ditemukan",
        suggestion: "Buat user admin terlebih dahulu di /admin/setup"
      });
    }

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        has_password: !!user.password_hash,
        is_admin: user.role === 'admin'
      },
      message: user.role === 'admin' 
        ? "User adalah admin, bisa login" 
        : "User bukan admin. Update role menjadi 'admin' untuk bisa login"
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err?.message ?? "Server error",
      details: err?.stack 
    }, { status: 500 });
  }
}

// GET untuk cek semua users
export async function GET() {
  try {
    await ensureSchema();
    
    const result = await sql`
      select id, email, name, role, created_at
      from users 
      order by created_at desc
    `;
    const users = Array.isArray(result) ? result : (result as any).rows ?? [];
    
    return NextResponse.json({
      total: users.length,
      admins: users.filter((u: any) => u.role === 'admin').length,
      regular_users: users.filter((u: any) => u.role === 'user').length,
      users: users.map((u: any) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        created_at: u.created_at
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err?.message ?? "Server error" 
    }, { status: 500 });
  }
}

