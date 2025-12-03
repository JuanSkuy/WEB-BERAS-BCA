import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

type CartItem = { product_id: string; quantity: number };

type CheckoutRequest = {
  items: CartItem[];
  payment_method?: string;
  shipping_cost_cents?: number;
  address_id?: string; // ID of saved address (if using saved address)
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
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    await ensureSchema();
    const {
      items,
      payment_method = "transfer",
      shipping_cost_cents = 0,
      address_id, // ID of saved address (optional)
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
    let subtotalCents = 0;
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      if (item.quantity <= 0) return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      if (product.stock < item.quantity)
        return NextResponse.json({ error: "Insufficient stock" }, { status: 409 });
      subtotalCents += product.price_cents * item.quantity;
    }

    // Calculate total including shipping
    const totalCents = subtotalCents + shipping_cost_cents;

    // Create order with status 'pending'
    const orderIns = await sql`
      insert into orders (user_id, total_cents, shipping_cost_cents, status) 
      values (${userId}, ${totalCents}, ${shipping_cost_cents}, 'pending') 
      returning id, total_cents, shipping_cost_cents, created_at, status
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

    // Get customer address (either from saved address or create new)
    let savedAddress: any = null;
    
    // If address_id is provided, use existing saved address
    if (address_id) {
      try {
        const addrResult = await sql`
          SELECT id, user_id, label, recipient_name, phone, address, city, postal_code, is_default, created_at, updated_at
          FROM addresses
          WHERE id = ${address_id} AND user_id = ${userId}
        `;
        const addrRows = Array.isArray(addrResult) ? addrResult : (addrResult as any).rows ?? [];
        savedAddress = addrRows[0] ?? null;
        
        if (!savedAddress) {
          return NextResponse.json({ error: "Saved address not found or unauthorized" }, { status: 404 });
        }
      } catch (addrErr) {
        console.error("Failed to fetch saved address:", addrErr);
        return NextResponse.json({ error: "Failed to fetch saved address" }, { status: 500 });
      }
    }
    // If no address_id but customer_info provided, create new address
    else if (customer_info && customer_info.address) {
      try {
        const addrIns = await sql`
          insert into addresses (user_id, recipient_name, phone, address, city, postal_code, created_at, updated_at)
          values (${userId}, ${customer_info.name ?? null}, ${customer_info.phone ?? null}, ${customer_info.address}, ${customer_info.city ?? null}, ${customer_info.postal ?? null}, now(), now())
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


