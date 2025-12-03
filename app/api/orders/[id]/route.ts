import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams.id;

    const result = await sql`
      SELECT 
        o.id,
        o.user_id,
        o.total_cents,
        o.shipping_cost_cents,
        o.status,
        o.payment_method,
        o.payment_invoice_number,
        o.payment_status,
        o.payment_channel,
        o.created_at,
        o.updated_at,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price_cents', oi.price_cents
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ${orderId} AND o.user_id = ${session.userId}
      GROUP BY o.id, o.user_id, o.total_cents, o.shipping_cost_cents, o.status, 
               o.payment_method, o.payment_invoice_number, o.payment_status, 
               o.payment_channel, o.created_at, o.updated_at
    `;

    const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
    const order = rows[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Ensure items is always an array
    if (!order.items || !Array.isArray(order.items)) {
      order.items = [];
    }

    return NextResponse.json({ order });
  } catch (err: any) {
    console.error("Error fetching order:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

