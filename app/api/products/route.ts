import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    await ensureSchema();
    const result = await sql`select id, name, price_cents, stock, created_at, updated_at from products order by created_at desc`;
    // Handle different response formats from sql
    const products = Array.isArray(result) ? result : (result as any).rows ?? [];
    return NextResponse.json({ products });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { name, price_cents, stock } = await req.json();
    if (!name || price_cents == null) {
      return NextResponse.json({ error: "name and price_cents required" }, { status: 400 });
    }
    const safeStock = Number.isFinite(stock) ? Number(stock) : 0;
    const result = await sql`
      insert into products (name, price_cents, stock) values (${String(name)}, ${Number(price_cents)}, ${safeStock})
      returning id, name, price_cents, stock, created_at, updated_at
    `;
    const products = Array.isArray(result) ? result : (result as any).rows ?? [];
    return NextResponse.json({ product: products[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureSchema();
    const { id, name, price_cents, stock } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (name != null) { fields.push(`name = $${idx++}`); values.push(String(name)); }
    if (price_cents != null) { fields.push(`price_cents = $${idx++}`); values.push(Number(price_cents)); }
    if (stock != null) { fields.push(`stock = $${idx++}`); values.push(Number(stock)); }
    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    values.push(String(id));
    const setSql = fields.join(", ");
    const result = await sql(`update products set ${setSql}, updated_at = now() where id = $${idx} returning id, name, price_cents, stock, created_at, updated_at`, values);
    return NextResponse.json({ product: (result as any).rows?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}


