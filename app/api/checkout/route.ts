import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";

type CartItem = { product_id: string; quantity: number };

type CheckoutRequest = {
  user_id?: string;
  items: CartItem[];
  payment_method?: string;
  customer_info?: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postal: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const {
      user_id,
      items,
      payment_method = "transfer",
      customer_info,
    } = (await req.json()) as CheckoutRequest;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }

    // Fetch product data for all items
    const productIds = items.map((i) => i.product_id);
    const res = await sql`select id, price_cents, stock from products where id = any(${productIds}::uuid[])`;
    const productMap = new Map<string, { price_cents: number; stock: number }>();
    const rows = Array.isArray(res) ? res : (res as any).rows ?? [];
    for (const row of rows) {
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

    // Create order with status 'pending'
    const orderIns = await sql`
      insert into orders (user_id, total_cents, status) 
      values (${user_id ?? null}, ${totalCents}, 'pending') 
      returning id, total_cents, created_at, status
    `;
    const orderRows = Array.isArray(orderIns) ? orderIns : (orderIns as any).rows ?? [];
    const order = orderRows[0];
    
    if (!order || !order.id) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Create order items
    for (const item of items) {
      const price = productMap.get(item.product_id)!.price_cents;
      await sql`
        insert into order_items (order_id, product_id, quantity, price_cents) 
        values (${order.id}, ${item.product_id}, ${item.quantity}, ${price})
      `;
      await sql`
        update products 
        set stock = stock - ${item.quantity}, updated_at = now() 
        where id = ${item.product_id}
      `;
    }

    // Save customer address (if provided)
    let savedAddress: any = null;
    if (customer_info && customer_info.address) {
      try {
        const addrIns = await sql`
          insert into addresses (user_id, recipient_name, phone, address, city, postal_code, created_at, updated_at)
          values (${user_id ?? null}, ${customer_info.name ?? null}, ${customer_info.phone ?? null}, ${customer_info.address}, ${customer_info.city ?? null}, ${customer_info.postal ?? null}, now(), now())
          returning id, user_id, label, recipient_name, phone, address, city, postal_code, is_default, created_at, updated_at
        `;
        const addrRows = Array.isArray(addrIns) ? addrIns : (addrIns as any).rows ?? [];
        savedAddress = addrRows[0] ?? null;

        // If this order is placed by a logged-in user, and they have no other addresses,
        // mark this new address as default.
        if (savedAddress && savedAddress.user_id) {
          try {
            const other = await sql`
              select count(*) as cnt from addresses where user_id = ${savedAddress.user_id} and id != ${savedAddress.id}
            `;
            const otherRows = Array.isArray(other) ? other : (other as any).rows ?? [];
            const cnt = otherRows[0] ? Number(otherRows[0].cnt ?? otherRows[0].count ?? 0) : 0;
            if (cnt === 0) {
              await sql`
                update addresses set is_default = true, updated_at = now() where id = ${savedAddress.id}
              `;
              // reflect change
              savedAddress.is_default = true;
            }
          } catch (countErr) {
            console.error("Failed to determine/set default address:", countErr);
          }
        }
      } catch (addrErr) {
        console.error("Failed to save address:", addrErr);
      }
    }

    return NextResponse.json({ 
      order: {
        id: order.id,
        total_cents: order.total_cents,
        status: order.status,
        created_at: order.created_at,
        customer_info,
        payment_method,
        address: savedAddress,
      }
    });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}


