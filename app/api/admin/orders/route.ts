import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-init";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    
    let query = sql`
      select 
        o.id, o.user_id, o.total_cents, o.status, o.created_at, o.updated_at,
        u.email as user_email, u.name as user_name,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price_cents', oi.price_cents
          )
        ) as items
      from orders o
      left join users u on o.user_id = u.id
      left join order_items oi on o.id = oi.order_id
      left join products p on oi.product_id = p.id
    `;
    
    if (status) {
      query = sql`
        select 
          o.id, o.user_id, o.total_cents, o.status, o.created_at, o.updated_at,
          u.email as user_email, u.name as user_name,
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'price_cents', oi.price_cents
            )
          ) as items
        from orders o
        left join users u on o.user_id = u.id
        left join order_items oi on o.id = oi.order_id
        left join products p on oi.product_id = p.id
        where o.status = ${status}
        group by o.id, o.user_id, o.total_cents, o.status, o.created_at, o.updated_at, u.email, u.name
        order by o.created_at desc
      `;
    } else {
      query = sql`
        select 
          o.id, o.user_id, o.total_cents, o.status, o.created_at, o.updated_at,
          u.email as user_email, u.name as user_name,
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'price_cents', oi.price_cents
            )
          ) as items
        from orders o
        left join users u on o.user_id = u.id
        left join order_items oi on o.id = oi.order_id
        left join products p on oi.product_id = p.id
        group by o.id, o.user_id, o.total_cents, o.status, o.created_at, o.updated_at, u.email, u.name
        order by o.created_at desc
      `;
    }
    
    const result = await query;
    const orders = Array.isArray(result) ? result : (result as any).rows ?? [];
    return NextResponse.json({ orders });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const { orderId, status } = await req.json();
    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
    }

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await sql`
      update orders 
      set status = ${status}, updated_at = now()
      where id = ${orderId}
    `;

    return NextResponse.json({ message: "Order status updated" });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

