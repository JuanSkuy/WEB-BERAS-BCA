import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";

type CartItem = { product_id: string; quantity: number };

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { user_id, items } = (await req.json()) as { user_id?: string; items: CartItem[] };
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }

    // Fetch product data for all items
    const productIds = items.map((i) => i.product_id);
    const res = await sql`select id, price_cents, stock from products where id = any(${productIds}::uuid[])`;
    const productMap = new Map<string, { price_cents: number; stock: number }>();
    for (const row of (res as any).rows ?? []) {
      productMap.set(row.id, { price_cents: row.price_cents, stock: row.stock });
    }

    // Validate stock and compute total
    let totalCents = 0;
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      if (item.quantity <= 0) return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      if (product.stock < item.quantity)
        return NextResponse.json({ error: "Insufficient stock" }, { status: 409 });
      totalCents += product.price_cents * item.quantity;
    }

    // Create order and items, decrement stock
    const orderIns = await sql`insert into orders (user_id, total_cents) values (${user_id ?? null}, ${totalCents}) returning id, total_cents, created_at`;
    const order = (orderIns as any).rows?.[0];
    if (!order || !order.id) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    for (const item of items) {
      const price = productMap.get(item.product_id)!.price_cents;
      await sql`insert into order_items (order_id, product_id, quantity, price_cents) values (${order.id}, ${item.product_id}, ${item.quantity}, ${price})`;
      await sql`update products set stock = stock - ${item.quantity}, updated_at = now() where id = ${item.product_id}`;
    }

    return NextResponse.json({ order });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}


