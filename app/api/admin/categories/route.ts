import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-init";

export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const result = await sql`
      select id, name, description, created_at, updated_at
      from categories
      order by name
    `;
    const categories = Array.isArray(result) ? result : (result as any).rows ?? [];
    return NextResponse.json({ categories });
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
    
    const { name, description } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const result = await sql`
      insert into categories (name, description)
      values (${String(name)}, ${description || null})
      returning id, name, description, created_at, updated_at
    `;
    const category = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const { id, name, description } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name != null) {
      updates.push(`name = $${idx++}`);
      values.push(String(name));
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(String(id));
    const setSql = updates.join(", ");
    const result = await sql(
      `update categories set ${setSql}, updated_at = now() where id = $${idx} returning id, name, description, created_at, updated_at`,
      values
    );
    const category = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    return NextResponse.json({ category });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    await sql`delete from categories where id = ${id}`;
    return NextResponse.json({ message: "Category deleted" });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

