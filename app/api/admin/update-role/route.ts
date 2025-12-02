import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-init";

export const runtime = "nodejs";

// Endpoint untuk update role user (hanya admin yang bisa)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const { email, role } = await req.json();
    
    if (!email || !role) {
      return NextResponse.json({ error: "Email and role required" }, { status: 400 });
    }

    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json({ error: "Role must be 'user' or 'admin'" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    
    // Update role
    const result = await sql`
      update users 
      set role = ${role}
      where lower(trim(email)) = ${normalizedEmail}
      returning id, email, role
    `;
    
    const updated = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Role updated successfully",
      user: updated
    });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

