import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-init";

export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const result = await sql`
      select 
        p.id, p.name, p.price_cents, p.stock, p.image, p.description,
        p.category_id, c.name as category_name,
        p.created_at, p.updated_at
      from products p
      left join categories c on p.category_id = c.id
      order by p.created_at desc
    `;
    const products = Array.isArray(result) ? result : (result as any).rows ?? [];
    return NextResponse.json({ products });
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
    
    const { name, price_cents, stock, image, description, category_id } = await req.json();
    if (!name || price_cents == null) {
      return NextResponse.json({ error: "Name and price required" }, { status: 400 });
    }

    const result = await sql`
      insert into products (name, price_cents, stock, image, description, category_id)
      values (
        ${String(name)}, 
        ${Number(price_cents)}, 
        ${Number(stock) || 0},
        ${image || null},
        ${description || null},
        ${category_id || null}
      )
      returning id, name, price_cents, stock, image, description, category_id, created_at, updated_at
    `;
    const product = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const { id, name, price_cents, stock, image, description, category_id } = await req.json();
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
    if (price_cents != null) {
      updates.push(`price_cents = $${idx++}`);
      values.push(Number(price_cents));
    }
    if (stock != null) {
      updates.push(`stock = $${idx++}`);
      values.push(Number(stock));
    }
    if (image !== undefined) {
      updates.push(`image = $${idx++}`);
      values.push(image || null);
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description || null);
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${idx++}`);
      values.push(category_id || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(String(id));
    const setSql = updates.join(", ");
    const result = await sql(
      `update products set ${setSql}, updated_at = now() where id = $${idx} returning id, name, price_cents, stock, image, description, category_id, created_at, updated_at`,
      values
    );
    const product = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    return NextResponse.json({ product });
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

    await sql`delete from products where id = ${id}`;
    return NextResponse.json({ message: "Product deleted" });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

