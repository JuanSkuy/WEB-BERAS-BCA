import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-init";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const result = await sql`
      select 
        id, email, name, role, created_at
      from users
      order by created_at desc
    `;
    const users = Array.isArray(result) ? result : (result as any).rows ?? [];
    return NextResponse.json({ users });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const { email, password, name, role } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (role && role !== 'user' && role !== 'admin') {
      return NextResponse.json({ error: "Role must be 'user' or 'admin'" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const passwordHash = await bcrypt.hash(String(password), 10);
    const userRole = role || 'user';

    // Check if email already exists
    const existing = await sql`select id from users where email = ${normalizedEmail} limit 1`;
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const newId = randomUUID();
    const result = await sql`
      insert into users (id, email, password_hash, name, role)
      values (${newId}, ${normalizedEmail}, ${passwordHash}, ${name || null}, ${userRole})
      returning id, email, name, role, created_at
    `;
    const user = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    
    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const { id, email, name, role } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    if (role && role !== 'user' && role !== 'admin') {
      return NextResponse.json({ error: "Role must be 'user' or 'admin'" }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (email != null) {
      updates.push(`email = $${idx++}`);
      values.push(String(email).toLowerCase().trim());
    }
    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name || null);
    }
    if (role != null) {
      updates.push(`role = $${idx++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(String(id));
    const setSql = updates.join(", ");
    const result = await sql(
      `update users set ${setSql} where id = $${idx} returning id, email, name, role, created_at`,
      values
    );
    const user = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ user });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    // Check if user has orders
    const ordersCheck = await sql`
      select count(*)::int as count
      from orders
      where user_id = ${id}
    `;
    const orderCount = Array.isArray(ordersCheck) 
      ? ordersCheck[0]?.count || 0 
      : (ordersCheck as any).rows?.[0]?.count || 0;

    if (orderCount > 0) {
      return NextResponse.json({ 
        error: "Cannot delete user with existing orders. Please delete orders first." 
      }, { status: 400 });
    }

    // Delete user
    const result = await sql`
      delete from users 
      where id = ${id}
      returning id
    `;
    
    const deleted = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    
    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

