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
    
    // Build the query - simplified to match working pattern
    let result;
    if (status) {
      result = await sql`
        SELECT 
          o.id, o.user_id, o.total_cents, o.status, o.created_at, o.updated_at,
          u.email as user_email, u.name as user_name,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'price_cents', oi.price_cents
            )
          ) as items
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.status = ${status}
        GROUP BY o.id, o.user_id, o.total_cents, o.status, o.created_at, o.updated_at, u.email, u.name
        ORDER BY o.created_at DESC
      `;
    } else {
      result = await sql`
        SELECT 
          o.id, o.user_id, o.total_cents, o.status, o.created_at, o.updated_at,
          u.email as user_email, u.name as user_name,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'price_cents', oi.price_cents
            )
          ) as items
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        GROUP BY o.id, o.user_id, o.total_cents, o.status, o.created_at, o.updated_at, u.email, u.name
        ORDER BY o.created_at DESC
        LIMIT 1000
      `;
    }
    
    const orders = Array.isArray(result) ? result : (result as any).rows ?? [];
    
    // Handle null items - convert to empty array if null
    const processedOrders = orders.map((order: any) => ({
      ...order,
      items: order.items && Array.isArray(order.items) ? order.items : []
    }));
    
    return NextResponse.json({ orders: processedOrders });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching admin orders:", error);
    return NextResponse.json({ 
      error: error?.message ?? "Server error",
      details: process.env.NODE_ENV === "development" ? error?.stack : undefined
    }, { status: 500 });
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

